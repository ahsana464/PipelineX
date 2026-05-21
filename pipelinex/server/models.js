import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
}, { timestamps: true })

const pipelineSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  repoUrl:     { type: String, required: true },
  stack:       { type: String, default: '' },
  branch:      { type: String, default: 'main' },
  status:      { type: String, enum: ['pending','running','success','failed'], default: 'pending' },
  dockerfile:  { type: String, default: '' },
  cicdConfig:  { type: String, default: '' },
  buildTime:   { type: String, default: '' },
  deployUrl:   { type: String, default: '' },
  containerId: { type: String, default: '' },
  deployedPort:{ type: Number, default: 0 },
  testCommand: { type: String, default: '' },
  imageSize:   { type: String, default: '' },
  logs:        [{ type: String }],
  stages:      [{
    name:   String,
    status: { type: String, enum: ['pending','running','success','failed'], default: 'pending' },
    duration: String,
  }],
}, { timestamps: true })

const settingsSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  dockerHubToken: { type: String, default: '' },
  dockerHubUsername: { type: String, default: '' },
  githubToken:    { type: String, default: '' },
  azureClientId:      { type: String, default: '' },
  azureClientSecret:  { type: String, default: '' },
  azureTenantId:      { type: String, default: '' },
  azureSubscriptionId:{ type: String, default: '' },
  notifications:  {
    email:   { type: Boolean, default: true },
    slack:   { type: Boolean, default: false },
    webhook: { type: Boolean, default: false },
  },
  webhookUrl: { type: String, default: '' },
}, { timestamps: true })

export const User     = mongoose.model('User', userSchema)
export const Pipeline = mongoose.model('Pipeline', pipelineSchema)
export const Settings = mongoose.model('Settings', settingsSchema)
