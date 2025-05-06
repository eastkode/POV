# POV - Odisha News Website

A modern news website focused on Odisha news, with enhanced SEO and content optimization features.

## Features

- Aggregates news from multiple Odisha news sources
- Filters news for Western Odisha districts
- Responsive design with Montserrat font
- Teal blue, yellow, and white color scheme
- News caching using localStorage
- Loading spinner while fetching news
- Filter between All News and Western Odisha Only
- Enhanced SEO with DeepSeek integration
- Automatic content optimization
- Structured data generation
- Social media sharing integration

## Setup Instructions

1. Clone this repository
2. Open `index.html` in a modern web browser
3. The website will automatically fetch news from the RSS feeds
4. News articles will be cached in localStorage for faster loading

## Note on Image Handling

Due to browser security restrictions, the website cannot automatically download and save images. To handle images:

1. Create an `images` folder in the project directory
2. Add a default thumbnail image named `default-thumbnail.jpg`
3. For production use, you would need to:
   - Create a backend server to handle image downloads
   - Or use a separate script to batch download images from the RSS feeds

## Supported RSS Feeds

- Odisha TV
- Odisha Bytes
- Dharitri
- Odisha News Online
- The Hindu
- New Indian Express

## Technology Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- RSS Parser (via CDN)
- Moment.js (for date formatting)
- DeepSeek API for content optimization
- SEO optimization tools

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is for educational purposes only. All news content belongs to their respective publishers.
