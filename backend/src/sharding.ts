/**
 * Sharding Entry Point
 * Run this to start the bot with sharding enabled
 */

import 'dotenv/config';
import { BotShardManager } from './bot/ShardManager.js';

const manager = new BotShardManager();
manager.spawn();
