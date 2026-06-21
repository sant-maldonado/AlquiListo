import fetch from 'node-fetch';

const login = await fetch('http://localhost:4000/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'prop@test.com', password:'123456'}) });
const { token } = await login.json();
console.log('Logged in');

const list = [
  { title:'Depto Palermo 2 amb', description:'Luminoso, balcón, laundry.', price:280000, rooms:2, address:'Santa Fe 1234, Palermo', neighborhood:'Palermo', accepts_pets:true, expenses:8500, amenities:['balcon','lavadero'] },
  { title:'Casa Belgrano 3 amb', description:'Cochera, parrilla, jardín.', price:350000, rooms:3, address:'Cabildo 5678, Belgrano', neighborhood:'Belgrano', accepts_pets:true, expenses:12000, amenities:['cochera','parrilla'] },
  { title:'Monoambiente Recoleta', description:'Moderno, laundry, seguridad.', price:150000, rooms:1, address:'Las Heras 901, Recoleta', neighborhood:'Recoleta', accepts_pets:false, expenses:6000, amenities:['lavadero','seguridad_24hs'] },
];

for (const p of list) {
  const r = await fetch('http://localhost:4000/api/properties', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify(p) });
  const data = await r.json();
  if (r.status !== 201) { console.log(`FAIL create ${p.title}:`, data); continue; }
  const id = data.property.id;
  // Publish
  const pub = await fetch(`http://localhost:4000/api/properties/${id}/status`, { method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify({status:'published'}) });
  if (pub.status === 200) console.log(`OK ${p.title} -> published`);
  else console.log(`FAIL publish ${p.title}:`, await pub.json());
}

// Verify public listing
const pubList = await fetch('http://localhost:4000/api/properties');
const { properties } = await pubList.json();
console.log(`\nPublicadas: ${properties.length}`);
properties.forEach(p => console.log(`  ${p.title} - $${p.price} - ${p.neighborhood}`));
