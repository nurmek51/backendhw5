import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://backend:8000/openapi.json',
  output: 'src/backend-schemas',
  client: 'axios',
}); 