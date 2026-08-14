(async ()=>{
  const mongoose = require('mongoose');
  const uri = process.env.MONGODB_URI;
  if(!uri){ console.error('MONGODB_URI not set'); process.exit(1); }
  try{
    const m = uri.match(/^mongodb\+srv:\/\/(?:(.+?)@)?([^\/]+)(\/.+?)?(\?.*)?$/);
    if(!m){ console.error('not mongodb+srv'); process.exit(2); }
    const auth = m[1] ? `${m[1]}@` : '';
    const dbPath = m[3] || '';
    const query = m[4] || '';
    const hosts = [
      'ac-02xygxu-shard-00-00.eocgmwz.mongodb.net:27017',
      'ac-02xygxu-shard-00-01.eocgmwz.mongodb.net:27017',
      'ac-02xygxu-shard-00-02.eocgmwz.mongodb.net:27017'
    ];
    const fallback = `mongodb://${auth}${hosts.join(',')}${dbPath}${query}`;
    console.log('Trying manual fallback URI', fallback);
    await mongoose.connect(fallback,{serverSelectionTimeoutMS:5000});
    console.log('CONNECTED manual fallback');
    await mongoose.disconnect();
    process.exit(0);
  }catch(e){ console.error('manual fallback failed', e.message||e); process.exit(3); }
})();
