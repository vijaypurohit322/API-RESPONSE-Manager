const bcrypt = require('bcrypt');
const saltRounds = 10;
const plainTextPassword = 'password';

bcrypt.hash(plainTextPassword, saltRounds, function(err, hash) {
    console.log(hash);
});
