const express = require('express');
const cors = require('cors');
const app = express();
const knex = require('knex');
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(cors());

var postgres = knex(({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : '4858',
    database : 'facedetector'
  }
}));



app.post('/signin',(req,resp)=>{
  postgres('login').where({
  email: req.body.email
}).select('*').then(user=> { 
	const isvalid = bcrypt.compareSync( req.body.password,user[0].hash);
	if(isvalid){
	return postgres('users').where({
    	email: req.body.email
}).select('*')
	}
}).then(correctUser=> resp.json(correctUser[0]))
.catch(err=>resp.json("wrong creds"))
  
})


app.post('/register',(req,resp)=>{
	const hash = bcrypt.hashSync(req.body.password,10);

	postgres.transaction((trx)=>{

    trx.insert({name :req.body.email.split('@')[0],email : req.body.email,hash :hash })
    .into('login')
    .returning('email')
    .then(email=> {
      return trx('users').returning('*').insert({name : req.body.email.split('@')[0],email : req.body.email,joined : new Date() })
	.then(user=>resp.json(user[0]))
    })
    .then(trx.commit)
    .catch(trx.rollback)
	})
	.catch(err=>resp.status(400).json('user exists'));
})



app.put('/images',(req,resp)=>{
	postgres('users')
  .where('id', '=', req.body.id)
  .increment('submits', 1)
    .returning('submits').then(entries=> resp.json(entries[0]))
  })


app.get('/:id',(req,resp)=>{
	postgres('users').where({
  id: req.params.id
}).select('*').then(user=>
{
	if(user.length)
		resp.json(user);
	else
		resp.json('no one');
}
)
});



app.listen(3001);