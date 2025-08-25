This is the backend service for the docreader guide platform.

## About

This project is a RESTful backend API for the docreader guide platform.
It is built using Node.js, Express and Prisma.

---

## Getting Started

### Prerequisites

- `npm` >= 9.x
- `postgresql` running locally or remotely

### Installation

```
git clone https://github.com/asaber3030/nodejs-docreader-faculty
cd nodejs-docreader-faculty
npm install
```

### Set Up

Before running the service, you must first create the `.env` file and populate the necessary environment variables. Refer to [this section](#environment-variables) for details.

You must also make sure that you have a postgresql deployment running.

Run the following command to migrate the Prisma schema to it (after populating `DATABASE_URL` environment variable):

```
npx prisma generate
npx prisma migrate dev
```

### Running

```
npm run start
```

### Long-term Considerations

Consider creating a service script (for whatever init system your server distro uses) for the daemon, for better integration and management.

---

## Environment Variables

Create a `.env` file in the root directory and configure the following:

```env

# Used to enable or disable debugging output
NODE_ENV='production'||'development' # defaults to 'production'

# Connection variables
PORT=tcp_port

# CORS variables (needed in dev only; prod should handle CORS via Nginx)
FRONTEND_URL=url_of_frontend_server

# Cookie variables
COOKIE_DOMAIN=domains_allowed_to_set_httpOnly_cookies

# Database variables
DATABASE_URL=database_url

# JWT variables
JWT_SECRET=secret(private_key)_for_signing_JWTs
JWT_COOKIE_EXPIRES_IN_DAYS=n_days_until_jwt_expires
JWT_PRIVATE_KEY_PATH=path_to_JWT_public_key
JWT_PUBLIC_KEY_PATH=path_to_JWT_private_key

# Google API client variables. Obtain and configure them from your GCP dashboard.
GOOGLE_CLIENT_ID=google_client_id
GOOGLE_CLIENT_SECRET=google_client_secret
GOOGLE_REDIRECT_URI=google_redirect_uri_for_oauth2_callback

# Firbase variables (used for notification system)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=firebase_storage_bucket
FIREBASE_PRIVATE_KEY_PATH=firebase_private_key_path
FIREBASE_CLIENT_EMAIL=firebase_client_email
```

## Database Seeding Scripts

The `scripts` directory has some useful seeding scripts. Here's a description of each one:

1. `seedPermissions.js`: Seeds permissions for all action, scope and resource combinations.
2. `seedRoles.js`: Seeds the two default roles (`SuperAdmin` at id 0 and `User` at id 1) with expected (hard-coded) ids and appropriate permissions.
