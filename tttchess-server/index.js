var module = require("./ttt");
var app = new module.TTTChess();
app.SetConfig({
	"ListenPort" : 8080,
	"RoomTotal" : 100,
	"MaxClientNum" : 300
});
app.Startup();