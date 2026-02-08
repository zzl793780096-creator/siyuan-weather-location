# 思源笔记天气与位置插件

一个思源笔记插件，自动查询天气和位置信息，并通过模板插入到每日笔记中。

## 功能特点

- 🌤 **天气查询**: 支持多种天气数据源（OpenWeatherMap、高德地图）
- 📍 **位置查询**: 支持IP定位、浏览器定位、手动设置位置
- 📝 **模板支持**: 可自定义模板，提供丰富的模板变量
- 🤖 **自动插入**: 创建每日笔记时自动插入天气和位置信息
- 🎨 **多种格式**: 支持文本、表格等多种输出格式

## 安装方法

1. 从思源笔记集市下载插件
2. 在 设置 → 集市 → 插件 中启用插件

## 配置说明

### 天气设置

1. 选择天气数据源：
   - **OpenWeatherMap**: 国际通用，需要免费API Key
   - **高德地图**: 适合国内用户，需要高德Key

2. 输入对应的API Key

### 位置设置

1. 选择位置获取方式：
   - **IP定位**: 自动根据IP获取大致位置，无需配置
   - **高德定位**: 使用浏览器定位获取精确位置，需要定位权限
   - **手动设置**: 手动设置固定位置

### 模板设置

插件支持自定义模板，可使用以下变量：

#### 天气变量
- `{{weather.description}}` - 天气描述（如：晴朗、多云）
- `{{weather.temperature}}` - 当前温度（°C）
- `{{weather.humidity}}` - 湿度（%）
- `{{weather.windSpeed}}` - 风速（m/s）
- `{{weather.pressure}}` - 气压（hPa）
- `{{weather.feelsLike}}` - 体感温度（°C）
- `{{weather.tempMin}}` - 最低温度（°C）
- `{{weather.tempMax}}` - 最高温度（°C）
- `{{weather.sunrise}}` - 日出时间
- `{{weather.sunset}}` - 日落时间

#### 位置变量
- `{{location.city}}` - 城市名称
- `{{location.country}}` - 国家名称
- `{{location.region}}` - 区域/区县
- `{{location.lat}}` - 纬度
- `{{location.lon}}` - 经度
- `{{location.ip}}` - IP地址
- `{{location.timezone}}` - 时区

#### 其他变量
- `{{time}}` - 当前时间

### 默认模板

```markdown
## 今日天气与位置

🌤 **天气状况**: {{weather.description}}
🌡 **当前温度**: {{weather.temperature}}°C
💧 **相对湿度**: {{weather.humidity}}%
🌬 **风速**: {{weather.windSpeed}} m/s
🔽 **最低温度**: {{weather.tempMin}}°C
🔼 **最高温度**: {{weather.tempMax}}°C

📍 **当前位置**: {{location.city}}
🌐 **坐标**: {{location.lat}}, {{location.lon}}

⏰ **记录时间**: {{time}}
```

## 使用方法

### 方式一：自动插入（推荐）
在设置中开启"创建每日笔记时自动插入"，插件会在创建每日笔记时自动插入天气和位置信息。

### 方式二：手动插入
使用命令面板：
- `插入天气信息`
- `插入位置信息`
- `插入天气位置模板`

### 方式三：块菜单
右键点击任意块，选择：
- `插入天气信息`
- `插入位置信息`
- `插入天气位置模板`

## 获取 API Key

### OpenWeatherMap
1. 访问 [openweathermap.org](https://openweathermap.org/api)
2. 注册免费账号
3. 在控制台获取 API Key

### 高德地图
1. 访问 [lbs.amap.com](https://lbs.amap.com/)
2. 注册账号并创建应用
3. 获取 Web服务 API Key

### 和风天气
1. 访问 [dev.qweather.com](https://dev.qweather.com/)
2. 注册账号并创建项目
3. 获取 API Key

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建
pnpm run build
```

## 模板示例

### 简洁模板
```markdown
**天气**: {{weather.description}} | **温度**: {{weather.temperature}}°C | **位置**: {{location.city}}
```

### 表格模板
```markdown
| 项目 | 数值 |
|------|------|
| 天气 | {{weather.description}} |
| 温度 | {{weather.temperature}}°C |
| 湿度 | {{weather.humidity}}% |
| 位置 | {{location.city}} |
| 时间 | {{time}} |
```

### 带条件的模板
```markdown
## 今日天气

🌤 **天气**: {{weather.description}}
🌡 **温度**: {{weather.temperature}}°C
{{#if weather.feelsLike}}🤔 **体感**: {{weather.feelsLike}}°C
{{/if}}💧 **湿度**: {{weather.humidity}}%

📍 **位置**: {{location.city}}
⏰ **时间**: {{time}}
```

## 注意事项

1. **API Key 安全**: 请妥善保管你的 API Key，不要分享给他人
2. **免费额度**: 各天气API都有免费调用额度，超出后可能需要付费
3. **定位精度**: IP定位精度约为城市级别，如需更精确请使用浏览器定位
4. **网络要求**: 插件需要网络连接才能获取天气和位置信息

## 常见问题

**Q: 为什么获取不到天气信息？**
A: 请检查：
- API Key 是否正确设置
- 网络连接是否正常
- 天气服务商是否可用

**Q: 为什么位置不准确？**
A: IP定位的精度有限，如需更精确的位置，请使用高德定位或手动设置。

**Q: 如何关闭自动插入？**
A: 在插件设置中关闭"创建每日笔记时自动插入"选项。

## 许可证

MIT License
