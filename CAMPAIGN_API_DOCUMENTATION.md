# Campaign API Documentation

This document describes the Campaign API endpoints for the Election Campaign Messaging System.

## Base URL

```
/api/campaigns
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Campaign

**POST** `/api/campaigns`

Creates a new campaign.

**Required Permissions:** `campaign:create`

**Request Body:**

```json
{
  "name": "Campaign Name",
  "description": "Campaign description",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-02-15T00:00:00.000Z",
  "targetAudience": ["young_voters", "first_time_voters"],
  "budget": 5000,
  "tags": ["tag1", "tag2"]
}
```

**Required Fields:**

- `name`: Campaign name (max 200 characters)
- `description`: Campaign description (max 1000 characters)
- `startDate`: Campaign start date (ISO string)
- `endDate`: Campaign end date (ISO string)
- `targetAudience`: Array of target audience segments

**Optional Fields:**

- `budget`: Campaign budget (number)
- `tags`: Array of campaign tags

**Response (201):**

```json
{
  "success": true,
  "message": "Campaign created successfully",
  "data": {
    "id": "campaign_id",
    "name": "Campaign Name",
    "description": "Campaign description",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-02-15T00:00:00.000Z",
    "status": "draft",
    "targetAudience": ["young_voters", "first_time_voters"],
    "budget": 5000,
    "tags": ["tag1", "tag2"],
    "isActive": true
  }
}
```

**Error Responses:**

- `400`: Missing required fields, invalid dates, invalid target audience
- `409`: Campaign name already exists for the creator
- `500`: Server error

---

### 2. Search Campaigns

**GET** `/api/campaigns`

Search and filter campaigns with pagination.

**Required Permissions:** `campaign:read`

**Query Parameters:**

- `name`: Campaign name (partial match)
- `status`: Campaign status (draft, active, paused, completed, cancelled)
- `targetAudience`: Target audience segment
- `createdBy`: User ID of campaign creator
- `startDate`: Campaign start date (ISO string)
- `endDate`: Campaign end date (ISO string)
- `isActive`: Active status (true/false)
- `limit`: Results per page (default: 20, max: 100)
- `page`: Page number (default: 1)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort direction (asc/desc, default: desc)

**Example Request:**

```
GET /api/campaigns?name=Test&status=active&limit=10&page=1
```

**Response (200):**

```json
{
  "success": true,
  "message": "Campaigns retrieved successfully",
  "data": {
    "campaigns": [...],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### 3. Get Campaign by ID

**GET** `/api/campaigns/:id`

Retrieve a specific campaign by its ID.

**Required Permissions:** `campaign:read`

**Response (200):**

```json
{
  "success": true,
  "message": "Campaign retrieved successfully",
  "data": {
    "id": "campaign_id",
    "name": "Campaign Name",
    "description": "Campaign description",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-02-15T00:00:00.000Z",
    "status": "active",
    "targetAudience": ["young_voters"],
    "createdBy": "user_id",
    "budget": 5000,
    "tags": ["tag1"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `404`: Campaign not found
- `500`: Server error

---

### 4. Get Campaigns by Creator

**GET** `/api/campaigns/creator/:userId`

Get all campaigns created by a specific user.

**Required Permissions:** `campaign:read`

**Response (200):**

```json
{
  "success": true,
  "message": "Campaigns retrieved successfully",
  "data": {
    "creatorId": "user_id",
    "campaigns": [...],
    "count": 5
  }
}
```

---

### 5. Get Active Campaigns

**GET** `/api/campaigns/active`

Get all currently active campaigns.

**Required Permissions:** `campaign:read`

**Response (200):**

```json
{
  "success": true,
  "message": "Active campaigns retrieved successfully",
  "data": {
    "campaigns": [...],
    "count": 3
  }
}
```

---

### 6. Get Campaigns by Target Audience

**GET** `/api/campaigns/audience/:audience`

Get campaigns targeting a specific audience segment.

**Required Permissions:** `campaign:read`

**Response (200):**

```json
{
  "success": true,
  "message": "Campaigns retrieved successfully",
  "data": {
    "targetAudience": "young_voters",
    "campaigns": [...],
    "count": 2
  }
}
```

---

### 7. Update Campaign

**PUT** `/api/campaigns/:id`

Update an existing campaign.

**Required Permissions:** `campaign:update`

**Request Body:**

```json
{
  "name": "Updated Campaign Name",
  "description": "Updated description",
  "budget": 7500,
  "tags": ["updated", "tag2"]
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Campaign updated successfully",
  "data": {
    // Updated campaign object
  }
}
```

**Error Responses:**

- `400`: Invalid dates (start date must be before end date)
- `404`: Campaign not found
- `500`: Server error

---

### 8. Delete Campaign

**DELETE** `/api/campaigns/:id`

Soft delete a campaign (sets isActive to false and status to cancelled).

**Required Permissions:** `campaign:delete`

**Response (200):**

```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

**Error Responses:**

- `404`: Campaign not found
- `500`: Server error

---

### 9. Activate Campaign

**POST** `/api/campaigns/:id/activate`

Activate a draft campaign.

**Required Permissions:** `campaign:update`

**Response (200):**

```json
{
  "success": true,
  "message": "Campaign activated successfully",
  "data": {
    // Updated campaign object with status: "active"
  }
}
```

**Error Responses:**

- `400`: Only draft campaigns can be activated, cannot activate with past start date
- `404`: Campaign not found
- `500`: Server error

---

### 10. Pause Campaign

**POST** `/api/campaigns/:id/pause`

Pause an active campaign.

**Required Permissions:** `campaign:update`

**Response (200):**

```json
{
  "success": true,
  "message": "Campaign paused successfully",
  "data": {
    // Updated campaign object with status: "paused"
  }
}
```

**Error Responses:**

- `400`: Only active campaigns can be paused
- `404`: Campaign not found
- `500`: Server error

---

### 11. Complete Campaign

**POST** `/api/campaigns/:id/complete`

Mark a campaign as completed.

**Required Permissions:** `campaign:update`

**Response (200):**

```json
{
  "success": true,
  "message": "Campaign completed successfully",
  "data": {
    // Updated campaign object with status: "completed"
  }
}
```

**Error Responses:**

- `400`: Only active or paused campaigns can be completed
- `404`: Campaign not found
- `500`: Server error

---

### 12. Duplicate Campaign

**POST** `/api/campaigns/:id/duplicate`

Create a copy of an existing campaign.

**Required Permissions:** `campaign:create`

**Request Body:**

```json
{
  "newName": "Campaign Name - Copy"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Campaign duplicated successfully",
  "data": {
    // New duplicated campaign object
  }
}
```

**Error Responses:**

- `400`: New name is required
- `404`: Original campaign not found
- `409`: Campaign name already exists for the creator
- `500`: Server error

---

### 13. Get Campaign Statistics

**GET** `/api/campaigns/statistics`

Get comprehensive campaign statistics.

**Required Permissions:** `campaign:read`

**Query Parameters:**

- `createdBy`: Filter statistics by creator (optional)

**Response (200):**

```json
{
  "success": true,
  "message": "Campaign statistics retrieved successfully",
  "data": {
    "totalCampaigns": 25,
    "draftCampaigns": 5,
    "activeCampaigns": 10,
    "pausedCampaigns": 3,
    "completedCampaigns": 5,
    "cancelledCampaigns": 2,
    "statusStats": [
      { "_id": "active", "count": 10 },
      { "_id": "draft", "count": 5 }
    ],
    "audienceStats": [
      { "_id": "young_voters", "count": 15 },
      { "_id": "first_time_voters", "count": 10 }
    ],
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Campaign Status Flow

```
DRAFT → ACTIVE → PAUSED → COMPLETED
  ↓         ↓       ↓
CANCELLED  CANCELLED  CANCELLED
```

- **DRAFT**: Initial state, can be edited
- **ACTIVE**: Running campaign, can be paused or completed
- **PAUSED**: Temporarily stopped, can be resumed or completed
- **COMPLETED**: Finished campaign
- **CANCELLED**: Cancelled campaign (soft deleted)

## Error Codes

| Code                      | Description                                   |
| ------------------------- | --------------------------------------------- |
| `MISSING_FIELDS`          | Required fields are missing                   |
| `INVALID_TARGET_AUDIENCE` | Target audience must be a non-empty array     |
| `INVALID_DATES`           | Start date must be before end date            |
| `CAMPAIGN_EXISTS`         | Campaign name already exists for the creator  |
| `CAMPAIGN_NOT_FOUND`      | Campaign with the specified ID not found      |
| `INVALID_CAMPAIGN_STATUS` | Invalid status transition                     |
| `INVALID_START_DATE`      | Cannot activate campaign with past start date |
| `MISSING_NEW_NAME`        | New name required for duplication             |
| `CAMPAIGN_NAME_EXISTS`    | Duplicate campaign name already exists        |

## Rate Limiting

All endpoints are subject to rate limiting based on the authentication middleware.

## Pagination

Search endpoints support pagination with the following parameters:

- `limit`: Number of results per page (default: 20, max: 100)
- `page`: Page number (default: 1)
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: Sort direction (asc/desc, default: desc)

## Examples

### Create a Campaign

```bash
curl -X POST /api/campaigns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Youth Outreach 2024",
    "description": "Campaign targeting young voters",
    "startDate": "2024-02-01T00:00:00.000Z",
    "endDate": "2024-03-01T00:00:00.000Z",
    "targetAudience": ["young_voters", "first_time_voters"],
    "budget": 10000,
    "tags": ["youth", "outreach", "2024"]
  }'
```

### Search Campaigns

```bash
curl -X GET "/api/campaigns?status=active&limit=10&page=1" \
  -H "Authorization: Bearer <token>"
```

### Activate a Campaign

```bash
curl -X POST /api/campaigns/<campaign_id>/activate \
  -H "Authorization: Bearer <token>"
```
