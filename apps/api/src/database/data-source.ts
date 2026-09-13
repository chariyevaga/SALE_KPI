import '../config/load-environment.js';
import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { getKpiDataSourceOptions } from './kpi-data-source.options.js';

export default new DataSource(getKpiDataSourceOptions());
