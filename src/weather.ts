export interface WeatherData {
  description: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  icon: string;
  feelsLike?: number;
  tempMin?: number;
  tempMax?: number;
  sunrise?: string;
  sunset?: string;
  windDirection?: string;
  windPower?: string;
}

interface PluginConfig {
  weatherApiKey: string;
  weatherProvider: 'openweather' | 'amap';
  amapKey: string;
}

export class WeatherService {
  private config: PluginConfig;
  private cachedWeather: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private cachedAdcode: Map<string, { adcode: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15分钟天气缓存
  private readonly ADCODE_CACHE_DURATION = 60 * 60 * 1000; // 1小时adcode缓存

  constructor(config: PluginConfig) {
    this.config = config;
  }

  updateConfig(config: PluginConfig) {
    this.config = config;
  }

  // 带超时的fetch请求
  private async fetchWithTimeout(url: string, timeout: number = 5000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时（${timeout}ms）`);
      }
      throw error;
    }
  }

  // 清除缓存
  clearCache() {
    this.cachedWeather.clear();
    this.cachedAdcode.clear();
    console.log('[WeatherService] 缓存已清除');
  }

  // 获取缓存的adcode
  private getCachedAdcode(lat: number, lon: number): string | null {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = this.cachedAdcode.get(key);
    if (cached && Date.now() - cached.timestamp < this.ADCODE_CACHE_DURATION) {
      return cached.adcode;
    }
    return null;
  }

  // 缓存adcode
  private cacheAdcode(lat: number, lon: number, adcode: string) {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    this.cachedAdcode.set(key, { adcode, timestamp: Date.now() });
  }

  // 获取天气信息
  async getWeather(lat: number, lon: number): Promise<WeatherData | null> {
    const cacheKey = `${this.config.weatherProvider}-${lat.toFixed(2)}-${lon.toFixed(2)}`;
    
    // 检查缓存
    const cached = this.cachedWeather.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('[WeatherService] 使用缓存的天气数据');
      return cached.data;
    }
    
    // 获取新数据
    let weather: WeatherData | null;
    switch (this.config.weatherProvider) {
      case 'openweather':
        weather = await this.getOpenWeatherData(lat, lon);
        break;
      case 'amap':
        weather = await this.getAmapWeatherData(lat, lon);
        break;
      default:
        weather = await this.getOpenWeatherData(lat, lon);
    }
    
    // 更新缓存
    if (weather) {
      this.cachedWeather.set(cacheKey, { data: weather, timestamp: Date.now() });
    }
    
    return weather;
  }

  // OpenWeatherMap API
  private async getOpenWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
    if (!this.config.weatherApiKey) {
      console.warn('[WeatherService] 未配置天气 API Key，使用模拟数据');
      return this.getMockWeatherData();
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.config.weatherApiKey}&units=metric&lang=zh_cn`;
      console.log('[WeatherService] 调用OpenWeatherMap API...');
      const response = await this.fetchWithTimeout(url, 5000);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('天气 API Key 无效，请检查配置');
        } else if (response.status === 404) {
          throw new Error('未找到该位置的天气信息');
        } else {
          throw new Error(`OpenWeather API 错误: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.weather || !data.weather[0]) {
        throw new Error('天气数据格式错误');
      }
      
      const windDeg = data.wind?.deg || 0;
      const windSpeed = data.wind?.speed || 0;
      
      return {
        description: this.translateWeatherDescription(data.weather[0]?.description || '未知'),
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: windSpeed,
        pressure: data.main.pressure,
        visibility: data.visibility ? data.visibility / 1000 : 10,
        icon: data.weather[0]?.icon || '',
        feelsLike: Math.round(data.main.feels_like),
        tempMin: Math.round(data.main.temp_min),
        tempMax: Math.round(data.main.temp_max),
        sunrise: data.sys.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString('zh-CN') : undefined,
        sunset: data.sys.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString('zh-CN') : undefined,
        windDirection: this.getWindDirection(windDeg),
        windPower: this.getWindPower(windSpeed)
      };
    } catch (error) {
      console.error('[WeatherService] 获取天气数据失败:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('[WeatherService] 天气 API 请求超时，使用模拟数据');
        } else {
          console.warn(`[WeatherService] ${error.message}，使用模拟数据`);
        }
      }
      return this.getMockWeatherData();
    }
  }

  // 根据角度获取风向
  private getWindDirection(deg: number): string {
    const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  }

  // 根据风速获取风力等级
  private getWindPower(speed: number): string {
    if (speed < 0.3) return '无风';
    if (speed < 1.6) return '1级';
    if (speed < 3.4) return '2级';
    if (speed < 5.5) return '3级';
    if (speed < 8.0) return '4级';
    if (speed < 10.8) return '5级';
    if (speed < 13.9) return '6级';
    if (speed < 17.2) return '7级';
    if (speed < 20.8) return '8级';
    if (speed < 24.5) return '9级';
    if (speed < 28.5) return '10级';
    if (speed < 32.7) return '11级';
    return '12级';
  }

  // 高德地图天气API
  private async getAmapWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
    if (!this.config.amapKey) {
      return this.getMockWeatherData();
    }

    try {
      // 尝试从缓存获取adcode
      let adcode = this.getCachedAdcode(lat, lon);
      
      if (!adcode) {
        // 没有缓存，需要先获取adcode
        const regeoUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${this.config.amapKey}&location=${lon},${lat}&extensions=base`;
        console.log('[WeatherService] 调用高德逆地理编码API...');
        const regeoResponse = await this.fetchWithTimeout(regeoUrl, 5000);
        const regeoData = await regeoResponse.json();

        if (regeoData.status !== '1' || !regeoData.regeocode) {
          throw new Error('高德逆地理编码失败');
        }

        adcode = regeoData.regeocode.addressComponent.adcode || '';
        if (adcode) {
          this.cacheAdcode(lat, lon, adcode);
          console.log('[WeatherService] 高德adcode已缓存:', adcode);
        }
      } else {
        console.log('[WeatherService] 使用缓存的高德adcode:', adcode);
      }
      
      // 获取天气预报信息
      const weatherUrl = `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.config.amapKey}&city=${adcode}&extensions=all`;
      console.log('[WeatherService] 调用高德天气API...');
      const weatherResponse = await this.fetchWithTimeout(weatherUrl, 5000);
      const weatherData = await weatherResponse.json();

      if (weatherData.status !== '1' || !weatherData.forecasts || weatherData.forecasts.length === 0) {
        throw new Error('高德天气API失败');
      }

      const forecast = weatherData.forecasts[0];
      const casts = forecast.casts || [];
      const todayCast = casts.length > 0 ? casts[0] : null;
      
      const dayWind = todayCast?.daywind || '东南风';
      const dayWindPower = todayCast?.daypower || '3';
      
      return {
        description: todayCast ? todayCast.dayweather || '晴朗' : '晴朗',
        temperature: todayCast ? parseInt(todayCast.daytemp) || 25 : 25,
        humidity: 60,
        windSpeed: this.parseWindSpeed(dayWindPower),
        pressure: 1013,
        visibility: 10,
        icon: '',
        tempMin: todayCast ? parseInt(todayCast.nighttemp) || 20 : 20,
        tempMax: todayCast ? parseInt(todayCast.daytemp) || 28 : 28,
        windDirection: dayWind,
        windPower: dayWindPower + '级'
      } as WeatherData;
    } catch (error) {
      console.error('[WeatherService] 高德天气API错误:', error);
      return this.getMockWeatherData();
    }
  }

  // 解析风力等级
  private parseWindSpeed(windPower: string): number {
    // 高德返回的风力格式如 "≤3", "4", "5-6" 等
    if (windPower.includes('≤')) {
      return 2;
    }
    if (windPower.includes('-')) {
      const [min, max] = windPower.split('-').map(Number);
      return (min + max) / 2;
    }
    const level = parseInt(windPower);
    if (!isNaN(level)) {
      // 将风力等级转换为近似风速 (m/s)
      const windSpeedMap: { [key: number]: number } = {
        0: 0, 1: 1.5, 2: 3, 3: 5, 4: 7, 5: 9, 6: 12, 7: 15, 8: 19, 9: 23
      };
      return windSpeedMap[level] || level * 2;
    }
    return 3;
  }

  // 翻译天气描述（OpenWeatherMap返回的是英文）
  private translateWeatherDescription(description: string): string {
    const translations: { [key: string]: string } = {
      'clear sky': '晴朗',
      'few clouds': '少云',
      'scattered clouds': '多云',
      'broken clouds': '阴天',
      'shower rain': '阵雨',
      'rain': '雨',
      'light rain': '小雨',
      'moderate rain': '中雨',
      'heavy rain': '大雨',
      'thunderstorm': '雷雨',
      'snow': '雪',
      'mist': '雾',
      'overcast clouds': '阴',
      'light snow': '小雪',
      'heavy snow': '大雪'
    };
    
    return translations[description.toLowerCase()] || description;
  }

  // 模拟天气数据（当API不可用时）
  private getMockWeatherData(): WeatherData {
    return {
      description: '晴朗',
      temperature: 25,
      humidity: 60,
      windSpeed: 3.5,
      pressure: 1013,
      visibility: 10,
      icon: '01d',
      feelsLike: 26,
      tempMin: 20,
      tempMax: 28,
      windDirection: '东南风',
      windPower: '3级'
    };
  }
}
