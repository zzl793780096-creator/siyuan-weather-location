export interface LocationData {
  // 基础信息
  city: string;
  country: string;
  lat: number;
  lon: number;
  ip?: string;
  timezone?: string;
  formatted_address?: string;
  source?: 'gps' | 'ip' | 'manual';  // 定位来源
  
  // 详细地址层级（按照高德地图地址Component结构）
  province?: string;      // 省份（如：湖南省）
  district?: string;      // 区县（如：华容县）
  township?: string;      // 乡镇/街道（如：章华镇）
  street?: string;        // 街道（如：人民路）
  streetNumber?: string;  // 门牌号（如：123号）
  
  // 向后兼容的字段
  region?: string;        // 区域/省份（兼容旧版，建议使用province）
}

// 常用城市英文名到中文名的映射表
const CITY_NAME_TRANSLATIONS: Record<string, string> = {
  // 直辖市
  'beijing': '北京', 'shanghai': '上海', 'tianjin': '天津', 'chongqing': '重庆',
  // 省会城市
  'guangzhou': '广州', 'shenzhen': '深圳', 'hangzhou': '杭州', 'nanjing': '南京',
  'wuhan': '武汉', 'chengdu': '成都', 'xian': '西安', 'zhengzhou': '郑州',
  'shijiazhuang': '石家庄', 'taiyuan': '太原', 'jinan': '济南', 'shenyang': '沈阳',
  'changchun': '长春', 'haerbin': '哈尔滨', 'nanning': '南宁', 'guiyang': '贵阳',
  'kunming': '昆明', 'lanzhou': '兰州', 'xining': '西宁', 'yinchuan': '银川',
  'wulumuqi': '乌鲁木齐', 'lasa': '拉萨', 'huhehaote': '呼和浩特', 'haikou': '海口',
  'fuzhou': '福州', 'hefei': '合肥', 'nanchang': '南昌', 'changsha': '长沙',
  'kunshan': '昆山',
  // 其他主要城市
  'suzhou': '苏州', 'wuxi': '无锡', 'changzhou': '常州', 'ningbo': '宁波',
  'wenzhou': '温州', 'jiaxing': '嘉兴', 'huzhou': '湖州', 'shaoxing': '绍兴',
  'jinhua': '金华', 'taizhou': '台州', 'xuzhou': '徐州', 'nantong': '南通',
  'yangzhou': '扬州', 'yancheng': '盐城', 'huaian': '淮安', 'zhenjiang': '镇江',
  'taizhou2': '泰州', 'suqian': '宿迁', 'dongguan': '东莞', 'foshan': '佛山',
  'zhongshan': '中山', 'zhuhai': '珠海', 'huizhou': '惠州', 'jiangmen': '江门',
  'qingyuan': '清远', 'zhaoqing': '肇庆', 'yunfu': '云浮', 'maoming': '茂名',
  'jiangsu': '江苏', 'zhejiang': '浙江', 'guangdong': '广东', 'fujian': '福建',
  'shandong': '山东', 'henan': '河南', 'hubei': '湖北', 'hunan': '湖南',
  'sichuan': '四川', 'yunnan': '云南', 'guizhou': '贵州', 'shaanxi': '陕西',
  'gansu': '甘肃', 'qinghai': '青海', 'taiwan': '台湾', 'hebei': '河北',
  'shanxi': '山西', 'liaoning': '辽宁', 'jilin': '吉林', 'heilongjiang': '黑龙江',
  'anhui': '安徽', 'jiangxi': '江西', 'guangxi': '广西', 'hainan': '海南',
  'neimenggu': '内蒙古', 'xizang': '西藏', 'ningxia': '宁夏', 'xinjiang': '新疆',
};

// 翻译城市名（英文转中文）
function translateCityName(cityName: string): string {
  if (!cityName) return cityName;
  
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(cityName)) {
    return cityName;
  }
  
  // 转换为小写并移除空格
  const normalizedName = cityName.toLowerCase().replace(/\s+/g, '');
  
  // 查找映射表
  if (CITY_NAME_TRANSLATIONS[normalizedName]) {
    return CITY_NAME_TRANSLATIONS[normalizedName];
  }
  
  // 如果没有找到翻译，返回原始名称
  return cityName;
}

interface PluginConfig {
  locationProvider: 'ip' | 'amap' | 'manual';
  manualLocation: string;
  amapKey: string;
  proxyEnabled?: boolean;
  proxyHost?: string;
  proxyPort?: number;
}

export class LocationService {
  private config: PluginConfig;
  private cachedLocation: LocationData | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

  constructor(config: PluginConfig) {
    this.config = config;
  }

  updateConfig(config: PluginConfig) {
    this.config = config;
  }

  // 带超时的网络请求
  private async fetchWithTimeout(url: string, timeout: number = 5000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
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

  // 检测系统代理设置（仅用于提示）
  private detectSystemProxy(): boolean {
    try {
      // 在浏览器环境中，我们无法直接检测系统代理
      // 但可以通过尝试访问一个已知可用的服务来判断
      return false;
    } catch (error) {
      return false;
    }
  }

  // 获取当前位置
  async getCurrentLocation(): Promise<LocationData | null> {
    // 检查缓存
    if (this.cachedLocation && Date.now() - this.cacheTime < this.CACHE_DURATION) {
      return this.cachedLocation;
    }

    let location: LocationData | null = null;

    switch (this.config.locationProvider) {
      case 'ip':
        location = await this.getLocationByIP();
        break;
      case 'amap':
        location = await this.getLocationByAmap();
        break;
      case 'manual':
        location = this.getManualLocation();
        break;
      default:
        location = await this.getLocationByIP();
    }

    if (location) {
      this.cachedLocation = location;
      this.cacheTime = Date.now();
    }

    return location;
  }

  // 通过IP获取位置（优化版本：优先使用直接返回坐标的服务）
  private async getLocationByIP(): Promise<LocationData | null> {
    // 优先使用直接返回坐标的服务，提高响应速度
    console.log('[LocationService] 开始IP定位（优先使用快速服务）...');
    
    // 尝试服务1: ipinfo.io（直接返回坐标，速度快）
    const result1 = await this.getLocationFromIpInfo();
    if (result1) return result1;
    
    // 尝试服务2: ipapi.co（直接返回坐标）
    const result2 = await this.getLocationFromIpApiCo();
    if (result2) return result2;
    
    // 尝试服务3: ip-api.com（直接返回坐标）
    const result3 = await this.getLocationFromIpApiCom();
    if (result3) return result3;
    
    // 最后尝试新浪IP查询（只返回城市名，需要额外查询坐标）
    const result4 = await this.getLocationFromSina();
    if (result4) return result4;
    
    console.error('[LocationService] 所有IP定位服务均失败');
    return null;
  }

  // 从 ipinfo.io 获取位置（推荐，响应快）
  private async getLocationFromIpInfo(): Promise<LocationData | null> {
    try {
      console.log('[LocationService] 尝试使用 ipinfo.io...');
      const response = await this.fetchWithTimeout('https://ipinfo.io/json', 3000);
      
      if (!response.ok) {
        throw new Error(`ipinfo.io 失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 解析 loc 字段 (格式: "lat,lon")
      let lat = 0;
      let lon = 0;
      if (data.loc) {
        const locParts = data.loc.split(',');
        if (locParts.length === 2) {
          lat = parseFloat(locParts[0]);
          lon = parseFloat(locParts[1]);
        }
      }
      
      if (!lat || !lon) {
        throw new Error('ipinfo.io 未返回有效坐标');
      }
      
      const cityName = translateCityName(data.city || '未知');
      const regionName = translateCityName(data.region || '');
      
      const result: LocationData = {
        // 基础信息
        city: cityName,
        country: data.country || '未知',
        lat: lat,
        lon: lon,
        ip: data.ip || '',
        timezone: data.timezone || '',
        formatted_address: `${cityName}${regionName ? ', ' + regionName : ''}${data.country ? ', ' + data.country : ''}`.trim(),
        source: 'ip',
        
        // 详细地址层级（IP定位无法提供，保持为空）
        province: regionName,
        district: '',
        township: '',
        street: '',
        streetNumber: '',
        
        // 向后兼容
        region: regionName
      };
      
      console.log('[LocationService] ipinfo.io 成功:', result.city);
      return result;
    } catch (error) {
      console.warn('[LocationService] ipinfo.io 失败:', error);
      return null;
    }
  }

  // 从 ipapi.co 获取位置
  private async getLocationFromIpApiCo(): Promise<LocationData | null> {
    try {
      console.log('[LocationService] 尝试使用 ipapi.co...');
      const response = await this.fetchWithTimeout('https://ipapi.co/json/', 3000);
      
      if (!response.ok) {
        throw new Error(`ipapi.co 失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.latitude || !data.longitude) {
        throw new Error('ipapi.co 未返回有效坐标');
      }
      
      const cityName = translateCityName(data.city || '未知');
      const regionName = translateCityName(data.region || '');
      
      const result: LocationData = {
        // 基础信息
        city: cityName,
        country: data.country_name || data.country || '未知',
        lat: data.latitude,
        lon: data.longitude,
        ip: data.ip || '',
        timezone: data.timezone || '',
        formatted_address: `${cityName}${regionName ? ', ' + regionName : ''}${data.country_name ? ', ' + data.country_name : ''}`.trim(),
        source: 'ip',
        
        // 详细地址层级（IP定位无法提供，保持为空）
        province: regionName,
        district: '',
        township: '',
        street: '',
        streetNumber: '',
        
        // 向后兼容
        region: regionName
      };
      
      console.log('[LocationService] ipapi.co 成功:', result.city);
      return result;
    } catch (error) {
      console.warn('[LocationService] ipapi.co 失败:', error);
      return null;
    }
  }

  // 从 ip-api.com 获取位置
  private async getLocationFromIpApiCom(): Promise<LocationData | null> {
    try {
      console.log('[LocationService] 尝试使用 ip-api.com...');
      const response = await this.fetchWithTimeout('https://ip-api.com/json/?lang=zh-CN', 3000);
      
      if (!response.ok) {
        throw new Error(`ip-api.com 失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error('ip-api.com 返回错误');
      }
      
      const cityName = translateCityName(data.city || '未知');
      const regionName = translateCityName(data.regionName || '');
      
      const result: LocationData = {
        // 基础信息
        city: cityName,
        country: data.country || '未知',
        lat: data.lat,
        lon: data.lon,
        ip: data.query,
        timezone: data.timezone,
        formatted_address: `${cityName}${regionName ? ', ' + regionName : ''}${data.country ? ', ' + data.country : ''}`.trim(),
        source: 'ip',
        
        // 详细地址层级（IP定位无法提供，保持为空）
        province: regionName,
        district: '',
        township: '',
        street: '',
        streetNumber: '',
        
        // 向后兼容
        region: regionName
      };
      
      console.log('[LocationService] ip-api.com 成功:', result.city);
      return result;
    } catch (error) {
      console.warn('[LocationService] ip-api.com 失败:', error);
      return null;
    }
  }

  // 从新浪IP查询获取位置（备用，只返回城市名）
  private async getLocationFromSina(): Promise<LocationData | null> {
    try {
      console.log('[LocationService] 尝试使用新浪IP查询...');
      const response = await this.fetchWithTimeout('https://int.dpool.sina.com.cn/iplookup/iplookup.php?format=json', 3000);
      
      if (!response.ok) {
        throw new Error(`新浪IP查询失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ret !== 1 && data.ret !== '1') {
        throw new Error('新浪IP查询返回错误');
      }
      
      const cityName = data.city || data.province || '';
      const province = data.province || '';
      
      if (!cityName) {
        throw new Error('新浪IP查询未返回城市信息');
      }
      
      // 新浪只返回城市名，需要再查询一次坐标，避免后续天气请求落到 (0, 0)
      console.log('[LocationService] 新浪IP查询成功，正在查询城市坐标...');
      const coordinateQuery = `${province}${cityName}`.trim() || cityName;
      const coordinates = await this.getCoordinatesByCity(coordinateQuery);
      if (!coordinates) {
        console.warn('[LocationService] 新浪IP查询成功，但无法解析城市坐标:', coordinateQuery);
        return null;
      }
      const result: LocationData = {
        // 基础信息
        city: cityName,
        country: data.country || '中国',
        lat: coordinates.lat,
        lon: coordinates.lon,
        ip: '',
        timezone: '',
        formatted_address: `${cityName}${province ? ', ' + province : ''}${data.country ? ', ' + data.country : ''}`.trim(),
        source: 'ip',
        
        // 详细地址层级
        province: province,
        district: data.district || '',
        township: '',
        street: '',
        streetNumber: '',
        
        // 向后兼容
        region: province
      };
      
      console.log('[LocationService] 新浪IP查询成功:', result.city, '坐标:', coordinates);
      return result;
    } catch (error) {
      console.warn('[LocationService] 新浪IP查询失败:', error);
      return null;
    }
  }

  // 通过高德地图获取位置（需要浏览器定位权限）
  private async getLocationByAmap(): Promise<LocationData | null> {
    if (!this.config.amapKey) {
      console.warn('[LocationService] 高德API Key未配置，回退到IP定位');
      return this.getLocationByIP();
    }

    try {
      console.log('[LocationService] 开始获取浏览器地理位置...');
      // 首先尝试获取浏览器地理位置（带重试机制）
      const browserLocation = await this.getBrowserLocationWithRetry();
      
      if (browserLocation) {
        console.log('[LocationService] 浏览器定位成功:', browserLocation);
        // 使用高德逆地理编码获取详细地址信息（extensions=all获取区/县级别精度）
        const regeoUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${this.config.amapKey}&location=${browserLocation.lon},${browserLocation.lat}&extensions=all`;
        console.log('[LocationService] 调用高德逆地理编码API（获取详细地址）...');
        const regeoResponse = await this.fetchWithTimeout(regeoUrl, 5000);
        const regeoData = await regeoResponse.json();

        if (regeoData.status === '1' && regeoData.regeocode) {
          const address = regeoData.regeocode.addressComponent;
          const formattedAddress = regeoData.regeocode.formatted_address || '';
          
          // 按照高德地图完整地址层级解析
          const result: LocationData = {
            // 基础信息
            city: address.city || address.province || '未知',
            country: '中国',
            lat: browserLocation.lat,
            lon: browserLocation.lon,
            formatted_address: formattedAddress,
            source: 'gps',
            
            // 详细地址层级
            province: address.province || '',
            district: address.district || '',
            township: address.township || '',
            street: address.street || '',
            streetNumber: address.streetNumber || address.number || '',
            
            // 向后兼容
            region: address.province || ''
          };
          console.log('[LocationService] 高德定位成功（区/县级别）:', result);
          return result;
        } else {
          console.warn('[LocationService] 高德API返回错误:', regeoData.info);
        }
      } else {
        console.warn('[LocationService] 浏览器定位失败，回退到IP定位');
      }

      // 如果浏览器定位失败，回退到IP定位
      console.warn('[LocationService] 回退到IP定位（可能受代理影响）');
      return this.getLocationByIP();
    } catch (error) {
      console.error('[LocationService] 高德定位异常:', error);
      console.warn('[LocationService] 回退到IP定位');
      return this.getLocationByIP();
    }
  }

  // 获取浏览器地理位置（带重试机制）
  private async getBrowserLocationWithRetry(maxRetries: number = 2): Promise<{ lat: number; lon: number } | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[LocationService] 浏览器定位尝试 ${attempt}/${maxRetries}...`);
      
      try {
        const location = await this.getBrowserLocation();
        
        if (location) {
          // 验证位置精度和有效性
          if (this.isValidLocation(location)) {
            console.log(`[LocationService] 浏览器定位成功（第${attempt}次尝试）:`, location);
            return location;
          } else {
            console.warn(`[LocationService] 浏览器定位结果无效（第${attempt}次尝试）:`, location);
          }
        }
      } catch (error) {
        console.error(`[LocationService] 浏览器定位异常（第${attempt}次尝试）:`, error);
      }
      
      // 如果不是最后一次尝试，等待一段时间后重试
      if (attempt < maxRetries) {
        const waitTime = attempt * 1000; // 递减等待时间：1秒、2秒
        console.log(`[LocationService] 等待 ${waitTime}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    console.warn('[LocationService] 所有浏览器定位尝试均失败');
    return null;
  }

  // 验证位置是否有效
  private isValidLocation(location: { lat: number; lon: number }): boolean {
    // 检查经纬度是否在有效范围内
    if (location.lat < -90 || location.lat > 90) {
      console.warn('[LocationService] 纬度超出有效范围:', location.lat);
      return false;
    }
    
    if (location.lon < -180 || location.lon > 180) {
      console.warn('[LocationService] 经度超出有效范围:', location.lon);
      return false;
    }
    
    // 检查是否为默认值（0, 0）
    if (location.lat === 0 && location.lon === 0) {
      console.warn('[LocationService] 位置为默认值 (0, 0)');
      return false;
    }
    
    return true;
  }

  // 验证位置是否在中国境内（用于检测代理导致的错误定位）
  private isValidChinaLocation(location: LocationData): boolean {
    // 中国的大致经纬度范围
    const CHINA_BOUNDS = {
      minLat: 3.86,
      maxLat: 53.55,
      minLon: 73.66,
      maxLon: 135.05
    };

    const isValid = location.lat >= CHINA_BOUNDS.minLat && 
                    location.lat <= CHINA_BOUNDS.maxLat &&
                    location.lon >= CHINA_BOUNDS.minLon && 
                    location.lon <= CHINA_BOUNDS.maxLon;

    if (!isValid) {
      console.warn('[LocationService] 检测到异常位置（可能受代理影响）:', location);
    }

    return isValid;
  }

  // 获取浏览器地理位置
  private getBrowserLocation(): Promise<{ lat: number; lon: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('[LocationService] 浏览器不支持地理位置API');
        resolve(null);
        return;
      }

      console.log('[LocationService] 请求浏览器地理位置权限...');
      console.log('[LocationService] 隐私说明: 位置数据仅用于获取天气信息，不会上传或共享');
      
      navigator.geolocation.getCurrentPosition(
          (position) => {
            const accuracy = position.coords.accuracy;
            console.log('[LocationService] 浏览器定位成功，精度:', accuracy, '米');
            
            // 检查定位精度是否合理
            if (accuracy > 5000) {
              console.warn('[LocationService] 定位精度过低（>5000米），可能不准确');
            }
            
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
          },
          (error) => {
            const errorMessages: Record<number, string> = {
              1: '用户拒绝了地理位置请求。请在浏览器设置中允许位置权限，或使用IP定位/手动定位',
              2: '无法获取位置信息。请检查设备定位功能是否正常',
              3: '获取位置信息超时。请重试或使用IP定位'
            };
            console.error('[LocationService] 浏览器定位失败:', errorMessages[error.code] || error.message);
            console.error('[LocationService] 错误代码:', error.code);
            console.log('[LocationService] 隐私保护: 位置数据仅在本地处理，符合相关数据安全法规');
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        );
    });
  }

  // 获取手动设置的位置
  private getManualLocation(): LocationData | null {
    if (!this.config.manualLocation) {
      return null;
    }

    // 解析手动位置格式:
    // 1) "城市名,纬度,经度"
    // 2) "城市名,国家,纬度,经度"（向后兼容）
    const parts = this.config.manualLocation.split(',');
    
    if (parts.length >= 3) {
      const city = parts[0].trim();
      let country = '';
      let lat: number;
      let lon: number;

      if (parts.length >= 4) {
        country = parts[1]?.trim() || '';
        lat = parseFloat(parts[2]);
        lon = parseFloat(parts[3]);
      } else {
        lat = parseFloat(parts[1]);
        lon = parseFloat(parts[2]);
      }

      if (!city || Number.isNaN(lat) || Number.isNaN(lon)) {
        console.warn('[LocationService] 手动位置格式不正确，解析失败:', this.config.manualLocation);
        return null;
      }
      
      return {
        // 基础信息
        city: city,
        country: country,
        lat: lat,
        lon: lon,
        formatted_address: `${city}${country ? ', ' + country : ''}`.trim(),
        source: 'manual',
        
        // 详细地址层级（手动设置无法提供，保持为空）
        province: '',
        district: '',
        township: '',
        street: '',
        streetNumber: '',
        
        // 向后兼容
        region: ''
      };
    }

    // 只有城市名，无法获取坐标，返回null
    console.warn('[LocationService] 手动位置格式不正确，需要提供经纬度');
    return null;
  }

  // 通过城市名获取坐标（用于手动设置）
  async getCoordinatesByCity(cityName: string): Promise<{ lat: number; lon: number } | null> {
    try {
      // 使用 OpenStreetMap Nominatim API (免费)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SiYuanWeatherLocationPlugin/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('地理编码失败');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // 清除缓存
  clearCache() {
    this.cachedLocation = null;
    this.cacheTime = 0;
  }
}
