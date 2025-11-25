const NodeCache = require('node-cache');

// Create a cache instance with default TTL of 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

// Cache key prefixes for better organization
const CACHE_PREFIXES = {
  SERVER_STATUS: 'server_status',
  ALL_SERVERS_STATUS: 'all_servers_status',
  DATAPACKS: 'datapacks',
  SEARCH_RESULTS: 'search_results',
  HISTORY: 'history'
};

// Generate cache keys
const generateKey = (prefix, ...args) => {
  return `${prefix}:${args.join(':')}`;
};

// Get data from cache
const get = (key) => {
  return cache.get(key);
};

// Set data to cache
const set = (key, value, ttl = null) => {
  if (ttl !== null) {
    return cache.set(key, value, ttl);
  }
  return cache.set(key, value);
};

// Delete data from cache
const del = (key) => {
  return cache.del(key);
};

// Flush all cache
const flushAll = () => {
  return cache.flushAll();
};

// Get server status from cache
const getServerStatus = (serverName) => {
  const key = generateKey(CACHE_PREFIXES.SERVER_STATUS, serverName);
  return get(key);
};

// Set server status to cache
const setServerStatus = (serverName, status, ttl = 120) => { // 2 minutes TTL for server status
  const key = generateKey(CACHE_PREFIXES.SERVER_STATUS, serverName);
  return set(key, status, ttl);
};

// Get all servers status from cache
const getAllServersStatus = () => {
  const key = CACHE_PREFIXES.ALL_SERVERS_STATUS;
  return get(key);
};

// Set all servers status to cache
const setAllServersStatus = (status, ttl = 60) => { // 1 minute TTL for all servers status
  const key = CACHE_PREFIXES.ALL_SERVERS_STATUS;
  return set(key, status, ttl);
};

// Get datapacks from cache
const getDatapacks = (serverName) => {
  const key = generateKey(CACHE_PREFIXES.DATAPACKS, serverName);
  return get(key);
};

// Set datapacks to cache
const setDatapacks = (serverName, datapacks, ttl = 300) => { // 5 minutes TTL for datapacks
  const key = generateKey(CACHE_PREFIXES.DATAPACKS, serverName);
  return set(key, datapacks, ttl);
};

// Get search results from cache
const getSearchResults = (query) => {
  const key = generateKey(CACHE_PREFIXES.SEARCH_RESULTS, query);
  return get(key);
};

// Set search results to cache
const setSearchResults = (query, results, ttl = 600) => { // 10 minutes TTL for search results
  const key = generateKey(CACHE_PREFIXES.SEARCH_RESULTS, query);
  return set(key, results, ttl);
};

// Get history from cache
const getHistory = (serverName) => {
  const key = generateKey(CACHE_PREFIXES.HISTORY, serverName);
  return get(key);
};

// Set history to cache
const setHistory = (serverName, history, ttl = 300) => { // 5 minutes TTL for history
  const key = generateKey(CACHE_PREFIXES.HISTORY, serverName);
  return set(key, history, ttl);
};

// Delete server status from cache
const clearServerStatus = (serverName) => {
  const key = generateKey(CACHE_PREFIXES.SERVER_STATUS, serverName);
  return del(key);
};

// Clear all servers status from cache
const clearAllServersStatus = () => {
  return del(CACHE_PREFIXES.ALL_SERVERS_STATUS);
};

// Clear all related cache for a specific server
const clearServerCache = (serverName) => {
  const serverStatusKey = generateKey(CACHE_PREFIXES.SERVER_STATUS, serverName);
  const datapacksKey = generateKey(CACHE_PREFIXES.DATAPACKS, serverName);
  const historyKey = generateKey(CACHE_PREFIXES.HISTORY, serverName);
  
  del(serverStatusKey);
  del(datapacksKey);
  del(historyKey);
};

module.exports = {
  get,
  set,
  del,
  flushAll,
  getServerStatus,
  setServerStatus,
  getAllServersStatus,
  setAllServersStatus,
  getDatapacks,
  setDatapacks,
  getSearchResults,
  setSearchResults,
  getHistory,
  setHistory,
  clearServerStatus,
  clearAllServersStatus,
  clearServerCache
};