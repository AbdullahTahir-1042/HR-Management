const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,   // no duplicate names
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    // The designated Team Lead for this department (a User with role 'employee')
    teamLead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // All employees assigned to this department
    employees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);