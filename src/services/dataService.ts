import {BindOrReplacements} from 'sequelize';
import fs from 'fs';
import path from 'path';

import { Hike } from '../db/models/hike.js';
import { Hiker } from '../db/models/hiker.js';
import { Photo } from '../db/models/photo.js';
import { User } from '../db/models/user.js';
import {HikeSearchParams, PhotoMetadata} from '../models/models.js';
import { db} from '../db/models/index.js';
import * as SharedService from '../services/sharedService.js';
import { IMAGES_PATH } from '../constants/constants.js';


//<editor-fold desc="Hike functions">
//</editor-fold>

//<editor-fold desc="User functions">
//</editor-fold>
