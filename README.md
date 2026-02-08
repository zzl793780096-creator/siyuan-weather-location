# Weather & Location Plugin for SiYuan

A SiYuan Note plugin that automatically fetches weather and location information, and inserts it into daily notes via templates.

## Features

- 🌤 **Weather Query**: Support multiple weather data sources (OpenWeatherMap, Amap)
- 📍 **Location Query**: Support IP geolocation, browser geolocation, and manual location setting
- 📝 **Template Support**: Customizable templates with rich variables
- 🤖 **Auto Insert**: Automatically insert into daily notes when created
- 🎨 **Multiple Output Formats**: Support text, table, and custom formats

## Installation

1. Download the latest release from the marketplace
2. Enable the plugin in Settings → Marketplace → Plugins

## Configuration

### Weather Settings

1. Select a weather data provider:
   - **OpenWeatherMap**: International, requires free API Key
   - **Amap**: For China users, requires Amap Key

2. Enter the corresponding API Key

### Location Settings

1. Select location provider:
   - **IP Geolocation**: Automatic, no configuration needed
   - **Amap Geolocation**: Precise location, requires browser permission
   - **Manual**: Set fixed location manually

### Template Settings

The plugin supports custom templates using the following variables:

#### Weather Variables
- `{{weather.description}}` - Weather description
- `{{weather.temperature}}` - Current temperature (°C)
- `{{weather.humidity}}` - Humidity (%)
- `{{weather.windSpeed}}` - Wind speed (m/s)
- `{{weather.pressure}}` - Pressure (hPa)
- `{{weather.feelsLike}}` - Feels like temperature (°C)
- `{{weather.tempMin}}` - Min temperature (°C)
- `{{weather.tempMax}}` - Max temperature (°C)

#### Location Variables
- `{{location.city}}` - City name
- `{{location.country}}` - Country name
- `{{location.region}}` - Region/District
- `{{location.lat}}` - Latitude
- `{{location.lon}}` - Longitude

#### Other Variables
- `{{time}}` - Current time

### Default Template

```markdown
## Weather & Location

🌤 **Weather**: {{weather.description}}
🌡 **Temperature**: {{weather.temperature}}°C
💧 **Humidity**: {{weather.humidity}}%
🌬 **Wind**: {{weather.windSpeed}} m/s

📍 **Location**: {{location.city}}, {{location.country}}
⏰ **Updated**: {{time}}
```

## Usage

### Method 1: Auto Insert (Recommended)
Enable "Auto insert when creating daily note" in settings. The plugin will automatically insert weather and location info when you create a new daily note.

### Method 2: Manual Insert
Use the command palette:
- `Insert Weather Info`
- `Insert Location Info`
- `Insert Weather & Location Template`

### Method 3: Block Menu
Right-click on any block, select:
- `Insert Weather Info`
- `Insert Location Info`
- `Insert Weather & Location Template`

## API Keys

### OpenWeatherMap
1. Visit [openweathermap.org](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API Key from the dashboard

### Amap
1. Visit [lbs.amap.com](https://lbs.amap.com/)
2. Register and create an application
3. Get the Web Service API Key

### QWeather
1. Visit [dev.qweather.com](https://dev.qweather.com/)
2. Register and create a project
3. Get your API Key

## Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm run dev

# Build
pnpm run build
```

## License

MIT
