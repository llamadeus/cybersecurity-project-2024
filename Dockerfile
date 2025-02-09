# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.1.36
FROM oven/bun:${BUN_VERSION}-slim AS base

# Base image
WORKDIR /app
ENV NODE_ENV="production"


FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends build-essential pkg-config python-is-python3

# Install node modules
COPY --link package.json bun.lockb ./
RUN bun install

# Copy application code
COPY --link . .

# Build application
RUN bunx svelte-kit sync
RUN DATABASE_URL=blabla bun run build

## Remove development dependencies
RUN rm -rf node_modules && \
    bun install --production


# Final stage for app image
FROM base AS app

# Copy built application
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

ENV PORT=4321
ENV HOST=0.0.0.0

# Start the server by default, this can be overwritten at runtime
EXPOSE 4321
CMD ["bun", "./build"]
