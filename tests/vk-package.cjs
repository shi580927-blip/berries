const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const page=fs.readFileSync('release_vk/index.html','utf8');
const find=s=>{const i=page.indexOf(s);assert(i>=0,'Missing '+s);return i};
const seq=[
 'window.BerriesPlatformConfig={platform:"vk"',
 'src/platform/platform.js',
 'vendor/vk-bridge.min.js',
 'src/platform/vk.js'
].map(find);
assert(seq.every((v,i)=>!i||v>seq[i-1]),'Incorrect platform script order');
assert(!page.includes('src/platform/local.js'),'VK build must not load local adapter');
for(const file of ['release_vk/vendor/vk-bridge.min.js','release_vk/src/platform/vk.js'])assert(fs.existsSync(file),'Missing '+file);
const facade=fs.readFileSync('release_vk/src/platform/platform.js','utf8');
const context={window:{BerriesPlatformConfig:{platform:'vk'},navigator:{language:'ru'},BerriesLifecycle:{paused:false},addEventListener:()=>{}},document:{addEventListener:()=>{},documentElement:{}},Map,Promise,Date,console};
vm.runInNewContext(facade,context);
assert.equal(context.window.BerriesPlatform.id,'vk');
console.log('PASS VK archive boot order, facade platform selection, SDK isolation');
