(async ()=>{
  const mongoose = require('mongoose');
  const dns = require('dns').promises;
  const uri = process.env.MONGODB_URI;
  if(!uri){ console.error('MONGODB_URI not set'); process.exit(1); }
  try{
    console.log('Trying primary URI');
    await mongoose.connect(uri,{serverSelectionTimeoutMS:5000});
    console.log('CONNECTED primary');
    await mongoose.disconnect();
    process.exit(0);
  }catch(e){
    console.error('primary failed', e.message||e);
    try{
      const m = uri.match(/^mongodb\+srv:\/\/(?:(.+?)@)?([^\/]+)(\/.+?)?(\?.*)?$/);
      if(!m) throw e;
      const auth = m[1] ? `${m[1]}@` : '';
      const srvHost = m[2];
      const dbPath = m[3] || '';
      const query = m[4] || '';
      const srvName = `_mongodb._tcp.${srvHost}`;
      console.log('Resolving', srvName);
      const records = await dns.resolveSrv(srvName);
      const hosts = records.map(r => `${r.name}:${r.port}`);
      console.log('Hosts from SRV', hosts);
      if(hosts.length === 0) throw new Error('no srv hosts');
      const fallback = `mongodb://${auth}${hosts.join(',')}${dbPath}${query}`;
      console.log('Trying fallback URI', fallback);
      await mongoose.connect(fallback,{serverSelectionTimeoutMS:5000});
      console.log('CONNECTED fallback');
      await mongoose.disconnect();
      process.exit(0);
    }catch(fe){
      console.error('fallback failed', fe.message||fe);
      process.exit(2);
    }
  }
})();
