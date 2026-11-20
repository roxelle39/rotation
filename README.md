
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import {
  multiply,
  cross,
  applyMatrix,
  transformVector,
  transformSVector
} from './algebra.js'