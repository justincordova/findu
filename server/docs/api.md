# API Documentation

## Discover

### Get Discover Feed
Returns a list of potential matches for the authenticated user, sorted by compatibility score.

- **URL**: `/api/discover`
- **Method**: `GET`
- **Query Params**:
  - `limit` (optional): Number of profiles to return (default: 10)
  - `offset` (optional): Pagination offset (default: 0)
- **Response**:
  ```json
  [
    {
      "user_id": "string",
      "name": "string",
      "age": number,
      "avatar_url": "string",
      "compatibilityScore": number, // 0-100
      ...other_profile_fields
    }
  ]
  ```

## Likes

### Create Like
Send a like to another user. If the other user has already liked the current user, a match is created automatically.

- **URL**: `/api/likes`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "to_user": "string", // ID of the user being liked
    "is_superlike": boolean // optional, default false
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "match": { ... } // Present if a match was created
  }
  ```

## Matches

### Get Matches
Get all matches for the authenticated user.

- **URL**: `/api/matches`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "id": "string", // Match ID
      "user": {       // The other user in the match
        "id": "string",
        "name": "string",
        "avatar_url": "string"
      },
      "matched_at": "string" // ISO Date
    }
  ]
  ```
