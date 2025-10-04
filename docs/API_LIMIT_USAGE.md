# API Limit Parameter Usage

This document explains how to use the `limit`, `skip`, and `sort` query parameters with the Fighters Edge API endpoints.

## Overview

Many endpoints now support pagination and limiting results through query parameters:

- `limit` - Maximum number of results to return
- `skip` - Number of results to skip (for pagination)
- `sort` - Field to sort by

## Query Parameters

### `limit`
- **Type**: Integer
- **Default**: Varies by endpoint (typically 10-20)
- **Maximum**: Varies by endpoint (typically 50-100)
- **Description**: Limits the number of results returned

### `skip`
- **Type**: Integer
- **Default**: 0
- **Minimum**: 0
- **Description**: Skips the specified number of results (useful for pagination)

### `sort`
- **Type**: String
- **Default**: Varies by endpoint (typically `_id` or `Name`)
- **Description**: Field name to sort by

### `sortDirection`
- **Type**: String (`asc` or `desc`)
- **Default**: `desc` (descending)
- **Description**: Sort direction - use `asc` for ascending, `desc` for descending

## Updated Endpoints

The following endpoints now support limit functionality:

### Characters
- `GET /characters` - Get all characters
- `GET /characterQuery` - Query characters

### Players
- `GET /players` - Get all players
- `GET /playerQuery` - Query players

### Videos
- `GET /videos` - Get all videos
- `GET /videoQuery` - Query videos
- `GET /videoCharacterQuery` - Query videos by character
- `GET /videoPlayerQuery` - Query videos by player
- `GET /videoGameQuery` - Query videos by game

### Home
- `GET /featured-matches/` - Get featured matches

## Usage Examples

### Basic Limit Usage

```bash
# Get first 5 characters
GET /characters?limit=5

# Get first 10 players
GET /players?limit=10

# Get first 3 videos
GET /videos?limit=3
```

### Pagination with Skip and Limit

```bash
# Get characters 11-20 (skip first 10, limit to 10)
GET /characters?skip=10&limit=10

# Get players 21-30
GET /players?skip=20&limit=10

# Get videos 6-10
GET /videos?skip=5&limit=5
```

### Sorting Results

```bash
# Sort characters by name (ascending)
GET /characters?sort=Name&sortDirection=asc

# Sort players by creation date (newest first - default descending)
GET /players?sort=_id

# Sort players by creation date (oldest first)
GET /players?sort=_id&sortDirection=asc

# Sort videos by a custom field (descending)
GET /videos?sort=CreatedDate&sortDirection=desc
```

### Combined Usage

```bash
# Get 5 characters sorted by name (ascending), skipping first 10
GET /characters?limit=5&skip=10&sort=Name&sortDirection=asc

# Get 20 players sorted by name (ascending), skipping first 5
GET /players?limit=20&skip=5&sort=Name&sortDirection=asc

# Get 10 videos sorted by creation date (descending), skipping first 15
GET /videos?limit=10&skip=15&sort=_id&sortDirection=desc

# Get 10 videos sorted by creation date (ascending), skipping first 15
GET /videos?limit=10&skip=15&sort=_id&sortDirection=asc
```

### Query Endpoints with Limits

```bash
# Query characters with limit and sorting
GET /characterQuery?queryName=GameId&queryValue=60f1b2c3d4e5f6789012345&limit=5&sort=Name&sortDirection=asc

# Query players with pagination and sorting
GET /playerQuery?queryName=Name&queryValue=John&skip=5&limit=10&sort=Name&sortDirection=asc

# Query videos with sorting and limiting
GET /videoQuery?queryName=GameId&queryValue=60f1b2c3d4e5f6789012345&limit=15&sort=CreatedDate&sortDirection=desc
```

## Default Values by Endpoint

| Endpoint | Default Limit | Max Limit | Default Sort | Default Direction |
|----------|---------------|-----------|--------------|-------------------|
| `/characters` | 20 | 100 | `_id` | `desc` |
| `/characterQuery` | 10 | 50 | `Name` | `asc` |
| `/players` | 20 | 100 | `_id` | `desc` |
| `/playerQuery` | 10 | 50 | `Name` | `asc` |
| `/videos` | 5 | 20 | `_id` | `desc` |
| `/videoQuery` | 5 | 20 | `_id` | `desc` |
| `/featured-matches/` | 10 | 50 | `_id` | `desc` |

## Error Handling

- Invalid `limit` values (negative, non-numeric) will use the default limit
- Invalid `skip` values (negative, non-numeric) will default to 0
- Invalid `sort` fields will use the default sort field
- Invalid `sortDirection` values (not `asc` or `desc`) will use the default direction
- Limits exceeding the maximum will be capped at the maximum value

## Performance Considerations

- Use appropriate limits to avoid performance issues
- Consider using `skip` for pagination instead of loading all data
- Be mindful of the maximum limits set for each endpoint
- For large datasets, consider implementing cursor-based pagination for better performance

## Frontend Integration Example

```javascript
// Example frontend function to fetch paginated data
async function fetchCharacters(page = 1, pageSize = 10, sortField = 'Name', sortDirection = 'asc') {
  const skip = (page - 1) * pageSize;
  const response = await fetch(`/characters?skip=${skip}&limit=${pageSize}&sort=${sortField}&sortDirection=${sortDirection}`);
  return response.json();
}

// Usage
const characters = await fetchCharacters(1, 10); // First page, 10 items, sorted by Name ascending
const moreCharacters = await fetchCharacters(2, 10); // Second page, 10 items
const newestCharacters = await fetchCharacters(1, 10, '_id', 'desc'); // Newest characters first
```
