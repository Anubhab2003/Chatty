import { pathToRegexp } from 'path-to-regexp';

function checkPath(path) {
  const keys = [];
  try {
    const regex = pathToRegexp(path, keys);
    console.log(`Valid path: ${path}`);
    console.log(`Keys:`, keys); // List of parameters
    console.log(`Regex:`, regex.toString());
  } catch (error) {
    console.error(`Error parsing path: ${path}`);
    console.error(error);
  }
}
