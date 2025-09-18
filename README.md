# React + TypeScript + Vite

# Prerequisites

- Node.js (v18 or later)
- pnpm (v9 or later)
- opttional: Corepack

# Getting Started

## Create schema

```bash
pnpm run create:schema
```

## Run the applications

```bash
pnpm install
pnpm run dev
```

# Thoughts and prayers

## Choice of stack

### Frontend

- React: Popular and well-supported front-end library. Also comforable with it.
- TypeScript: I like using typescript over js any day. Aso it's popular.
- Vite: as my bundeler it has tree-shaking like the others but it's not a paint to configure. Also i like using vitest for testing if i add testing.
- pnpm: I like pnpm over npm and yarn because of its speed and easier workspace support.
- Turborepo: Using it because it was mentioned and i used a little bit of it before when finding a replacement for lerna.
- swc: Maybe i might use it a bit over kill for the project.

### Backend

- Fastify: What i am comfortable with as i use it for work. Its faster only because of how it parses json.
- TypeScript: Same reason as frontend.
- pnpm: Same reason as frontend.
- Turborepo: Same reason as frontend.
- ts-node: I like using ts-node for small projects to avoid the build step. Proper project i'll use tsc to compile or a bundler like esbuild or rollup.
- sqlite3: Lightweight database that requires no setup. Perfect for this small project.

## Setting up simple schema

- Created 2 tables bookings and temp_bookings.
- bookings table is the main table that stores the booking date and user name.
- temp_bookings table just an idea i had to store the booking request temporarily. might no necessarily need it.
- bookings table has a unique constraint on the booking_date to prevent double booking. Simple way to do it.

## Test drive schema

Testing the queries and unique constraint manual query.
![alt text](querytest.png)

## sqlite3, sqlite issues

I was unable to run those libraries due to binding issues related to my M1 Mac. so i ended up using sql.js the most pure client side sqlite implementation.

## adding schema validation

added schema validation to prevent invalid data received and sent
![alt text](image.png)

## Moving on to the frontend!

started with a basic form with name,date after testing

I thought what if name is empty or date is invalid. So i added some basic validation. The dates cannot be booked in the past. so i added the code to disable the dates in date picker.

Then after getting an answer to a question where parts of the date can be booked i assumed that usually i book in hours so i split time slots for times in hours.

I also thought that maybe every 10 seconds id want swr to refresh the dates so i can get latest dates availble. On top of that click on the dates should refresh the component.

## Things that could be done better

- Add testing to both frontend and backend.
- Add better error handling and logging.
- compile or bundle the backend code.
- user who booked should have a list of their bookings.
- adding a queue system to handle high traffic.
