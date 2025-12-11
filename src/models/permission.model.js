// models/Permission.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const PermissionSchema = new mongoose.Schema({
  permissionId: {
    type: String,
    default: () => `perm_${uuidv4()}`,
    unique: true,
    immutable: true,
    index: true
  },
  key: {
    type: String,
    required: [true, 'Permission key is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9_]+:[A-Z0-9_]+$/, 'Permission key must be in format MODULE:ACTION'],
    immutable: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    trim: true,
    minlength: [3, 'Permission name must be at least 3 characters'],
    maxlength: [100, 'Permission name cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  module: {
    type: String,
    required: [true, 'Module is required'],
    enum: {
      values: [
        'USERS', 'DRIVERS', 'RIDES', 'PRICING', 'FINANCE',
        'SUPPORT', 'SYSTEM', 'ANALYTICS', 'PERMISSIONS',
        'ROLES', 'ADMINS', 'VEHICLES', 'LOCATIONS', 'NOTIFICATIONS',
        'REPORTS', 'SETTINGS', 'AUDIT', 'BACKUP'
      ],
      message: '{VALUE} is not a valid module'
    },
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['READ', 'WRITE', 'DELETE', 'MANAGE'],
    default: 'MANAGE',
    index: true
  },
  isActive: { type: Boolean, default: true, index: true },
  isSystemPermission: { type: Boolean, default: false, index: true },
  version: { type: Number, default: 1 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  // audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  // soft delete
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, index: true },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  // internal flag for cascade/protected deletes (not returned by default)
  protectedDelete: { type: Boolean, default: false, select: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  versionKey: false
});

// virtual - readable module
PermissionSchema.virtual('moduleName').get(function () {
  const map = {
    USERS: 'Users', DRIVERS: 'Drivers', RIDES: 'Rides', PRICING: 'Pricing',
    FINANCE: 'Finance', SUPPORT: 'Support', SYSTEM: 'System', ANALYTICS: 'Analytics',
    PERMISSIONS: 'Permissions', ROLES: 'Roles', ADMINS: 'Admins', VEHICLES: 'Vehicles',
    LOCATIONS: 'Locations', NOTIFICATIONS: 'Notifications', REPORTS: 'Reports',
    SETTINGS: 'Settings', AUDIT: 'Audit', BACKUP: 'Backup'
  };
  return map[this.module] || this.module;
});

// Protect system permissions from being soft-deleted via .save() or query middleware
PermissionSchema.pre('save', function (next) {
  if (this.isModified('isDeleted') && this.isDeleted && this.isSystemPermission) {
    return next(new Error('System permissions cannot be deleted'));
  }
  next();
});

// Protect system permissions when updates are performed via queries (findOneAndUpdate/updateOne)
async function preventSystemPermissionDelete(next) {
  const update = this.getUpdate && (this.getUpdate().$set || this.getUpdate());
  if (!update) return next();

  // If attempt to set isDeleted = true
  const deleting = (update.isDeleted === true) || (update.$set && update.$set.isDeleted === true);
  if (!deleting) return next();

  // Check target doc's isSystemPermission
  const filter = this.getQuery();
  const doc = await this.model.findOne(filter).select('isSystemPermission').lean();
  if (doc && doc.isSystemPermission) {
    return next(new Error('System permissions cannot be deleted'));
  }
  next();
}
PermissionSchema.pre('findOneAndUpdate', preventSystemPermissionDelete);
PermissionSchema.pre('updateOne', preventSystemPermissionDelete);
PermissionSchema.pre('updateMany', preventSystemPermissionDelete);

// Indexes: keep minimal necessary
PermissionSchema.index({ key: 1 }, { unique: true });
PermissionSchema.index({ module: 1, category: 1 });
PermissionSchema.index({ createdAt: -1 });

export default mongoose.model('Permission', PermissionSchema);
