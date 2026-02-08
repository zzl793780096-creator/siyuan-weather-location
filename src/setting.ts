import { App, showMessage, Dialog } from 'siyuan';

interface PluginConfig {
  weatherApiKey: string;
  weatherProvider: 'openweather' | 'amap';
  locationProvider: 'ip' | 'amap' | 'manual';
  manualLocation: string;
  template: string;
  amapKey: string;
}

export class SettingTab {
  private plugin: any;
  private config: PluginConfig;
  private i18n: any;

  constructor(app: App, plugin: any, config: PluginConfig) {
    this.plugin = plugin;
    this.config = config;
    this.i18n = (plugin as any).i18n || {};
  }

  getName(): string {
    return this.i18n.sectionWeather || '天气与位置';
  }

  getIcon(): string {
    return 'iconWeather';
  }

  render(containerEl: HTMLElement): void {
    containerEl.innerHTML = '';

    // 添加自定义样式
    this.addCustomStyles();

    // 天气设置
    this.createWeatherSection(containerEl);

    // 位置设置
    this.createLocationSection(containerEl);

    // 模板设置
    this.createTemplateSection(containerEl);

    // 操作按钮
    this.createActionButtons(containerEl);
  }

  private createWeatherSection(element: HTMLElement): void {
    const section = document.createElement('div');
    section.className = 'config__tab-container-item';

    const title = document.createElement('h3');
    title.textContent = '天气设置';
    section.appendChild(title);

    // 天气提供商选择
    const providerItem = document.createElement('div');
    providerItem.className = 'config__item';
    
    const providerLabel = document.createElement('label');
    providerLabel.className = 'config__item-label';
    providerLabel.textContent = '天气数据源';
    providerItem.appendChild(providerLabel);

    const providerSelect = document.createElement('select');
    providerSelect.className = 'config__item-select';
    
    const providers = [
      { value: 'openweather', label: 'OpenWeatherMap (国际)' },
      { value: 'amap', label: '高德地图 (中国)' }
    ];

    providers.forEach(p => {
      const option = document.createElement('option');
      option.value = p.value;
      option.textContent = p.label;
      if (p.value === this.config.weatherProvider) {
        option.selected = true;
      }
      providerSelect.appendChild(option);
    });

    providerSelect.addEventListener('change', (e) => {
      this.config.weatherProvider = (e.target as HTMLSelectElement).value as any;
    });

    providerItem.appendChild(providerSelect);
    section.appendChild(providerItem);

    // API Key 输入
    const apiKeyItem = document.createElement('div');
    apiKeyItem.className = 'config__item';

    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.className = 'config__item-label';
    apiKeyLabel.textContent = '天气 API Key';
    apiKeyItem.appendChild(apiKeyLabel);

    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'text';
    apiKeyInput.className = 'config__item-input';
    apiKeyInput.placeholder = '请输入 API Key';
    apiKeyInput.value = this.config.weatherApiKey;
    apiKeyInput.addEventListener('change', (e) => {
      this.config.weatherApiKey = (e.target as HTMLInputElement).value;
    });

    apiKeyItem.appendChild(apiKeyInput);
    section.appendChild(apiKeyItem);

    // API 说明
    const apiHelp = document.createElement('div');
    apiHelp.className = 'config__item-help';
    apiHelp.innerHTML = `
      <p>• OpenWeatherMap: 访问 <a href="https://openweathermap.org/api" target="_blank">openweathermap.org</a> 获取免费 API Key</p>
      <p>• 高德地图: 访问 <a href="https://lbs.amap.com/" target="_blank">lbs.amap.com</a> 获取 Key</p>
    `;
    section.appendChild(apiHelp);

    element.appendChild(section);
  }

  private createLocationSection(element: HTMLElement): void {
    const section = document.createElement('div');
    section.className = 'config__tab-container-item';

    const title = document.createElement('h3');
    title.textContent = '位置设置';
    section.appendChild(title);

    // 位置提供商选择
    const providerItem = document.createElement('div');
    providerItem.className = 'config__item';

    const providerLabel = document.createElement('label');
    providerLabel.className = 'config__item-label';
    providerLabel.textContent = '位置获取方式';
    providerItem.appendChild(providerLabel);

    const providerSelect = document.createElement('select');
    providerSelect.className = 'config__item-select';

    const providers = [
      { value: 'ip', label: 'IP定位 (自动)' },
      { value: 'amap', label: '高德定位 (需要定位权限)' },
      { value: 'manual', label: '手动设置' }
    ];

    providers.forEach(p => {
      const option = document.createElement('option');
      option.value = p.value;
      option.textContent = p.label;
      if (p.value === this.config.locationProvider) {
        option.selected = true;
      }
      providerSelect.appendChild(option);
    });

    const manualLocationItem = document.createElement('div');
    manualLocationItem.className = 'config__item';
    manualLocationItem.style.display = 
      this.config.locationProvider === 'manual' ? 'block' : 'none';

    providerSelect.addEventListener('change', (e) => {
      this.config.locationProvider = (e.target as HTMLSelectElement).value as any;
      // 显示/隐藏手动位置输入
      manualLocationItem.style.display = 
        this.config.locationProvider === 'manual' ? 'block' : 'none';
      // 显示/隐藏高德地图 Key
      amapKeyItem.style.display = 
        this.config.locationProvider === 'amap' ? 'block' : 'none';
    });

    providerItem.appendChild(providerSelect);
    section.appendChild(providerItem);

    // 高德地图 Key 输入
    const amapKeyItem = document.createElement('div');
    amapKeyItem.className = 'config__item';
    amapKeyItem.style.display = 
      this.config.locationProvider === 'amap' ? 'block' : 'none';

    const amapKeyLabel = document.createElement('label');
    amapKeyLabel.className = 'config__item-label';
    amapKeyLabel.textContent = '高德地图 Key';
    amapKeyItem.appendChild(amapKeyLabel);

    const amapKeyInput = document.createElement('input');
    amapKeyInput.type = 'text';
    amapKeyInput.className = 'config__item-input';
    amapKeyInput.placeholder = '使用高德服务时需要';
    amapKeyInput.value = this.config.amapKey;
    amapKeyInput.addEventListener('change', (e) => {
      this.config.amapKey = (e.target as HTMLInputElement).value;
    });

    amapKeyItem.appendChild(amapKeyInput);
    section.appendChild(amapKeyItem);

    // 手动位置输入
    const manualLocationLabel = document.createElement('label');
    manualLocationLabel.className = 'config__item-label';
    manualLocationLabel.textContent = '手动位置';
    manualLocationItem.appendChild(manualLocationLabel);

    const manualLocationInput = document.createElement('input');
    manualLocationInput.type = 'text';
    manualLocationInput.className = 'config__item-input';
    manualLocationInput.placeholder = '城市名,纬度,经度 (如: 北京,39.9,116.4)';
    manualLocationInput.value = this.config.manualLocation;
    manualLocationInput.addEventListener('change', (e) => {
      this.config.manualLocation = (e.target as HTMLInputElement).value;
    });

    manualLocationItem.appendChild(manualLocationInput);
    section.appendChild(manualLocationItem);

    // 位置说明
    const locationHelp = document.createElement('div');
    locationHelp.className = 'config__item-help';
    locationHelp.innerHTML = `
      <p>• IP定位: 自动根据网络IP获取大致位置，无需配置。支持多个备用服务</p>
      <p>• 高德定位: 使用浏览器定位获取精确位置，需要高德Key和浏览器定位权限</p>
      <p>• 手动设置: 固定使用设置的位置，格式: 城市名,纬度,经度 (如: 长沙,28.2,112.9)</p>
      <p style="color: #ff4d4f; margin-top: 8px;">⚠️ 注意: 如果无法获取位置，请检查网络连接或配置手动位置</p>
    `;
    section.appendChild(locationHelp);

    element.appendChild(section);
  }

  private createTemplateSection(element: HTMLElement): void {
    const section = document.createElement('div');
    section.className = 'config__tab-container-item';

    const title = document.createElement('h3');
    title.textContent = '模板设置';
    section.appendChild(title);

    // 模板选择按钮
    const templateButtons = document.createElement('div');
    templateButtons.className = 'config__item';
    templateButtons.style.display = 'flex';
    templateButtons.style.gap = '8px';

    const templates = [
      { name: '默认模板', key: 'default' },
      { name: '简洁模板', key: 'simple' },
      { name: '表格模板', key: 'table' }
    ];

    const templateTextarea = document.createElement('textarea');

    templates.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'b3-button b3-button--outline weather-location-plugin-btn';
      btn.textContent = t.name;
      btn.addEventListener('click', () => {
        if (t.key === 'default') {
          templateTextarea.value = this.getDefaultTemplateString();
        } else if (t.key === 'simple') {
          templateTextarea.value = `**天气**: {{weather.description}} | **温度**: {{weather.temperature}}°C | **位置**: {{location.city}}`;
        } else if (t.key === 'table') {
          templateTextarea.value = this.getTableTemplateString();
        }
        this.config.template = templateTextarea.value;
      });
      templateButtons.appendChild(btn);
    });

    section.appendChild(templateButtons);

    // 模板编辑器
    const templateItem = document.createElement('div');
    templateItem.className = 'config__item';

    const templateLabel = document.createElement('label');
    templateLabel.className = 'config__item-label';
    templateLabel.textContent = '自定义模板';
    templateItem.appendChild(templateLabel);

    templateTextarea.className = 'config__item-textarea';
    templateTextarea.style.height = '300px';
    templateTextarea.style.fontFamily = 'monospace';
    templateTextarea.value = this.config.template;
    templateTextarea.addEventListener('change', (e) => {
      this.config.template = (e.target as HTMLTextAreaElement).value;
    });

    templateItem.appendChild(templateTextarea);
    section.appendChild(templateItem);

    // 变量说明
    const varHelpBtn = document.createElement('button');
    varHelpBtn.className = 'b3-button b3-button--text weather-location-plugin-btn';
    varHelpBtn.textContent = '查看可用变量说明';
    varHelpBtn.addEventListener('click', () => {
      this.showVariableHelp();
    });
    section.appendChild(varHelpBtn);

    element.appendChild(section);
  }

  private createActionButtons(element: HTMLElement): void {
    const section = document.createElement('div');
    section.className = 'config__tab-container-item';
    section.style.display = 'flex';
    section.style.gap = '12px';

    // 保存按钮
    const saveBtn = document.createElement('button');
    saveBtn.className = 'b3-button b3-button--primary weather-location-plugin-btn';
    saveBtn.textContent = '保存设置';
    saveBtn.addEventListener('click', async () => {
      await this.plugin.saveConfig();
      showMessage('设置已保存');
    });
    section.appendChild(saveBtn);

    // 测试按钮
    const testBtn = document.createElement('button');
    testBtn.className = 'b3-button b3-button--outline weather-location-plugin-btn';
    testBtn.textContent = '测试获取数据';
    testBtn.addEventListener('click', async () => {
      await this.testDataFetch();
    });
    section.appendChild(testBtn);

    element.appendChild(section);
  }

  private async testDataFetch() {
    try {
      showMessage(this.i18n.msgFetchingData || '正在获取数据...');
      
      const data = await this.plugin.getTemplateData();
      
      const result = `天气: ${data.weather.description}
温度: ${data.weather.temperature}°C
位置: ${data.location.city}`;

      showMessage(this.i18n.msgFetchSuccess || '获取成功!');
    } catch (error) {
      showMessage((this.i18n.msgFetchFailed || '获取失败:') + ' ' + (error as Error).message);
    }
  }

  private showVariableHelp() {
    const helpContent = `# 模板变量说明

## 天气变量 (weather)
- {{weather.description}} - 天气描述
- {{weather.temperature}} - 当前温度 (°C)
- {{weather.humidity}} - 湿度 (%)
- {{weather.windSpeed}} - 风速 (m/s)
- {{weather.windDirection}} - 风向 (如: 北风, 东南风)
- {{weather.windPower}} - 风力等级 (如: 3级)
- {{weather.pressure}} - 气压 (hPa)
- {{weather.visibility}} - 能见度 (km)
- {{weather.feelsLike}} - 体感温度 (°C)
- {{weather.tempMin}} - 最低温度 (°C)
- {{weather.tempMax}} - 最高温度 (°C)
- {{weather.sunrise}} - 日出时间
- {{weather.sunset}} - 日落时间

## 位置变量 (location) - 按高德地图地址层级
- {{location.province}} - 省份 (如: 湖南省)
- {{location.city}} - 城市 (如: 岳阳市)
- {{location.district}} - 区县 (如: 华容县)
- {{location.township}} - 乡镇/街道 (如: 章华镇)
- {{location.street}} - 街道 (如: 人民路)
- {{location.streetNumber}} - 门牌号 (如: 123号)
- {{location.formatted_address}} - 标准化详细地址
- {{location.country}} - 国家
- {{location.lat}} - 纬度
- {{location.lon}} - 经度

### 向后兼容（旧版变量）
- {{location.region}} - 区域/省份（等同于province，建议使用province）

## 其他变量
- {{time}} - 当前时间

## 示例
🌤 **天气**: {{weather.description}}
🌡 **温度**: {{weather.temperature}}°C
🌬 **风向**: {{weather.windDirection}}
💨 **风力**: {{weather.windPower}}
📍 **位置**: {{location.city}}
🏛 **省份**: {{location.province}}
🏙 **区县**: {{location.district}}
🏘 **乡镇/街道**: {{location.township}}`;

    const dialog = new Dialog({
      title: this.i18n.dialogVariableHelpTitle || '模板变量说明',
      content: `<div style="padding: 16px; font-family: monospace; white-space: pre-wrap;">${helpContent}</div>`,
      width: '600px'
    });
  }

  private getDefaultTemplateString(): string {
    return `## 今日天气与位置

🌤 **天气状况**: {{weather.description}}
🌡 **当前温度**: {{weather.temperature}}°C
{{#if weather.feelsLike}}🤔 **体感温度**: {{weather.feelsLike}}°C
{{/if}}💧 **相对湿度**: {{weather.humidity}}%
🌬 **风向**: {{weather.windDirection}}
💨 **风力**: {{weather.windPower}}
📊 **风速**: {{weather.windSpeed}} m/s
🔽 **最低温度**: {{weather.tempMin}}°C
🔼 **最高温度**: {{weather.tempMax}}°C

📍 **当前位置**: {{location.city}}
{{#if location.province}}🏛 **省份**: {{location.province}}
{{/if}}{{#if location.district}}🏙 **区县**: {{location.district}}
{{/if}}{{#if location.township}}🏘 **乡镇/街道**: {{location.township}}
{{/if}}{{#if location.street}}🛣 **街道**: {{location.street}}
{{/if}}{{#if location.streetNumber}}🔢 **门牌号**: {{location.streetNumber}}
{{/if}}{{#if location.formatted_address}}📝 **详细地址**: {{location.formatted_address}}
{{/if}}{{#if location.country}}🌍 **国家**: {{location.country}}
{{/if}}🌐 **坐标**: {{location.lat}}, {{location.lon}}

⏰ **记录时间**: {{time}}
`;
  }

  private getTableTemplateString(): string {
    return `| 项目 | 数值 |
|------|------|
| 天气 | {{weather.description}} |
| 温度 | {{weather.temperature}}°C |
| 体感温度 | {{weather.feelsLike}}°C |
| 湿度 | {{weather.humidity}}% |
| 风向 | {{weather.windDirection}} |
| 风力 | {{weather.windPower}} |
| 风速 | {{weather.windSpeed}} m/s |
| 最低温度 | {{weather.tempMin}}°C |
| 最高温度 | {{weather.tempMax}}°C |
| 省份 | {{location.province}} |
| 城市 | {{location.city}} |
| 区县 | {{location.district}} |
| 乡镇/街道 | {{location.township}} |
| 街道 | {{location.street}} |
| 门牌号 | {{location.streetNumber}} |
| 详细地址 | {{location.formatted_address}} |
| 国家 | {{location.country}} |
| 纬度 | {{location.lat}} |
| 经度 | {{location.lon}} |
| 时间 | {{time}} |
`;
  }

  private addCustomStyles(): void {
    const styleId = 'weather-location-plugin-styles';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 自定义按钮样式 */
      .weather-location-plugin-btn {
        background-color: #1890ff !important;
        color: white !important;
        border:1px solid #1890ff !important;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
      }

      .weather-location-plugin-btn:hover {
        background-color: #096dd9 !important;
        border-color: #096dd9 !important;
        transform: scale(1.02);
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
      }

      .weather-location-plugin-btn:active {
        transform: scale(0.98);
      }

      /* 文本按钮特殊样式 */
      .weather-location-plugin-btn.b3-button--text {
        background-color: transparent !important;
        color: #1890ff !important;
        border: none !important;
        padding: 4px 8px;
      }

      .weather-location-plugin-btn.b3-button--text:hover {
        background-color: rgba(24, 144, 255, 0.1) !important;
        color: #096dd9 !important;
        transform: none;
        box-shadow: none;
      }
    `;
    document.head.appendChild(style);
  }
}
