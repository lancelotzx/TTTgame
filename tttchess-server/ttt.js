//wangjia mod
// 旁观者add
//1.var m_RoomData 对象化处理
//1.InitChessData 中m_RoomData对象化处理

exports.TTTChess = function()
{
	var MSG_ALL  = 0;//发送到所有用户
	var MSG_TO   = 1;//发送指定用户
	var MSG_ROOM = 2;//向指定桌发送消息
	
	var STAT_NORMAL = 0;//无状态
	var STAT_READY  = 1;//准备
	var STAT_START  = 2;//游戏中
	var STAT_OB     = 3;//旁观中
	
	var COLOR_BLACK = 1;//黑色 圈
	var COLOR_WHITE = 2;//白色 叉
	
	var m_Config = {
		"ListenPort" : 8080,
		"RoomTotal" : 100,
		"MaxClientNum" : 300   //300个用户
	};
	var m_Connections = [];//用户管理 这玩意里面都是连接到服务器的sid  by wangjia
	var m_Rooms = [];//房间管理，m_Rooms[roomidx][j] j==0或1 ,这个就是sid。
					 //sid在m_Connections数组中的下标。 这玩意里面内容也要改造 by wangjia
	//var m_RoomData = [];//房间内棋盘信息
	var m_RoomData = {}; //wangjia改造
	var n_Clients = 0;
	var self = this;
	var io;//socket.io
	
	//设置配置文件
	this.SetConfig = function(cfg)
	{
		for(var x in cfg)
		{
			m_Config[x] = cfg[x];
		}
	}
	
	//初始化棋盘数据 3*3 * 9  格棋盘,这里考虑用对象来改造之
	//m_RoomData.   先保留不改 wangjia20160911
	var InitChessData = function(roomIdx){
		m_RoomData[roomIdx] = [];
		for(var i = 0; i < 15; i++){
			m_RoomData[roomIdx][i] = [];
			for(var j = 0; j < 15; j++){
				m_RoomData[roomIdx][i][j] = 0;
			}
		}
	}
	
	//重置棋盘数据
	var ResetCheseData = function(roomIdx){
		for(var i =0 ; i < 15; i++){
			for(var j = 0; j < 15; j++){
				m_RoomData[roomIdx][i][j] = 0;
			}
		}
	}
	
	//启动服务
	this.Startup = function()
	{
		//初始化房间
		for(var i = 0; i < m_Config.RoomTotal; i++){
			m_Rooms[i] = [0,0,0];//[0, 0];
			InitChessData(i);
		}
		
		//网络服务
		io = require('socket.io').listen(m_Config.ListenPort);
		io.sockets.on('connection', function (socket) {
			//断开
			socket.on("disconnect", OnClose);
			
			//登陆
			socket.on("login", OnLogin);
			
			//加入房间
			socket.on("joinRoom", OnJoinRoom);
			
			//离开房间
			socket.on("leaveRoom", OnLeaveRoom);
			
			//准备
			socket.on("ready", OnReady);
			
			//消息
			socket.on('message', OnMessage);
			
			//落子
			socket.on("drawChess", OnDrawChess);
		});
		console.log('server is started, port: ' + m_Config.ListenPort);
	}

	//打印调试用接口
	function writeObj(obj){ 
		 var description = ""; 
		 for(var i in obj){ 
		  var property=obj[i]; 
		  description+=i+" = "+property+"\n"; 
		 } 
		 console.log(description); 
	} 

	
	//获取房间列表,return data
	var GetRoomList = function()
	{
		var data = [];
		for(var idx in m_Rooms){ //m_Rooms的两个维度为：roomidx 和 room中的[]序号，合起来定位一个sid
			var room = [0, 0, 0 ]; //room扩展为3个人
			for(var j = 0; j < 3; j++){ //改造by wangjia   j == 0,1,2 一个房间最多3个人
				if(m_Rooms[idx][j]){
					var c = m_Connections[m_Rooms[idx][j]];  //一个sid对应的m_Connections,即所有连接到这个房间的人
					                                         //todo:需要确定j==2时，c.status == STAT_OB
					if(c){
							room[j] = {
								"id" : c.socket.id,
								"nickname" : c.nickname,
								"status" : c.status
							};						
					}
				}
			}
			data.push(room);
		}
		return data;
	}
	
	//获取用户列表
	var GetUserList = function()
	{
		var list = [];
		for(var sid in m_Connections)
		{
			list.push(GetUserInfo(sid));
		}
		return list;
	}
	
	//获取用户信息
	var GetUserInfo = function(sid)
	{
		return {
			"id" : m_Connections[sid].socket.id,
			"nickname" : m_Connections[sid].nickname,
			"status" : m_Connections[sid].status
		}
	}
	
	//关闭链接
	var OnClose = function(data)
	{
		var sid = this.id;
		
		if(!m_Connections[sid]) return ;
		n_Clients--;
		
		
		//发送退出消息，wangjia改造中...
		//下面是对大厅的用户发出某桌的玩家退出的消息。旁观者应该没关系。TODO:需验证
		io.sockets.emit("close", {
			"id" : sid,
			"roomIdx" : m_Connections[sid].roomIdx,
			"posIdx" : m_Connections[sid].posIdx
		});
		
		//如果该房间内用户正在游戏，那么我退出的时候，重设另一个用户的状态
		//m_Connections[sid].posIdx只可能0或者1？从onJoinRoom开始初始化posidx 
		var roomIdx = m_Connections[sid].roomIdx;
		var posIdx  = m_Connections[sid].posIdx;
		if(roomIdx != -1){
			m_Rooms[roomIdx][posIdx] = 0;//退出房间了
			if(m_Connections[sid].status == STAT_START){
				if(posIdx == 0){
					if(m_Rooms[roomIdx][1] && m_Connections[m_Rooms[roomIdx][1]]){
						m_Connections[m_Rooms[roomIdx][1]].status = STAT_NORMAL;
					}
				}else if(posIdx == 1){
					if(m_Rooms[roomIdx][0] && m_Connections[m_Rooms[roomIdx][0]]){
						m_Connections[m_Rooms[roomIdx][0]].status = STAT_NORMAL;
					}
				}else{
					// 旁观者退出，不影响什么
				}
			}
		}
		
		//删除元素
		delete m_Connections[sid];
	}
	

	//用户登陆
	var OnLogin = function(data){
		writeObj(data);
		var ret = 0;
		var sid = this.id;
		if(n_Clients < m_Config.MaxClientNum){
			var client = { //一个用户的描述,关键部分，需改造by wangjia
				socket   : this,
				nickname : data.nickname,
				status   : STAT_NORMAL,//0-无状态, 1-准备, 2-游戏中
				roomIdx  : -1, //所处房间号
				posIdx   : -1 //所处房间的位置 ,原来是0，1两个位置，现在需要加上2，即旁观者
			};
			
			//更新客户端链接
			m_Connections[sid] = client;
			n_Clients++;
			
			//登陆成功
			this.emit("login", { //向当前socket发送给客户端登录成功命令
				"ret"  : 1, 
				"info" : GetUserInfo(sid),
				"list" : GetUserList(),
				"room" : GetRoomList()
			});
			
			//向全部socket发送用户加入大厅
			io.sockets.emit("join", GetUserInfo(sid));
		}else{
			//登陆失败
			this.emit("login", {"ret" : 0});
		}
	}	
	
	//加入房间
	var OnJoinRoom = function(data){
		var sid = this.id;//socket.io的用户id，还需要研究一下是怎么排列的 
		console.log("data.roomIdx = " + data.roomIdx);
		console.log("data.posIdx = " + data.posIdx);
		console.log("m_Rooms.." + m_Rooms[data.roomIdx][data.posIdx]);
		console.log("m_Connections.. " + m_Connections[sid]);   
		if(data.roomIdx > -1 && data.roomIdx < m_Config.RoomTotal && 
			(data.posIdx == 0 || data.posIdx == 1 || data.posIdx == 2) && //改造by wangjia 20160911 
			m_Rooms[data.roomIdx][data.posIdx] == 0 &&  //这里需要修改吗？ wangjia,需要，这就是sid
			m_Connections[sid] && ((m_Connections[sid].status != STAT_START) ||
				m_Connections[sid].status != STAT_OB))//add by wangjia
		{
			var oldRoomIdx = m_Connections[sid].roomIdx;
			var oldPosIdx  = m_Connections[sid].posIdx;
			
			//离开原座位
			if(oldRoomIdx != -1){
				m_Rooms[oldRoomIdx][oldPosIdx] = 0;
				io.sockets.emit("leaveRoom", {
					"id"	   : sid,
					"roomIdx"  : oldRoomIdx,
					"posIdx"   : oldPosIdx
				});
			}			
			
			//加入新房间，即没有人的房间？
			m_Connections[sid].roomIdx = data.roomIdx;
			m_Connections[sid].posIdx  = data.posIdx; //0,1,2
			m_Connections[sid].status  = STAT_NORMAL;
			m_Rooms[data.roomIdx][data.posIdx] = sid;
			io.sockets.emit("joinRoom", {
				"roomIdx"  : data.roomIdx,
				"posIdx"   : data.posIdx,//0,1,2
				"nickname" : m_Connections[sid].nickname,
				"id"       : sid
				//"observerIdx" : 
			});
			
			//发送房间内信息 ？ 改造ing by wangjia
			//要是房间里面有人了，就通过roomInfo消息告诉房间里面的人，我的信息，或者其他人的信息,最多3个人
			//观察者在这里处理
			var info = [0,0,0];
			for(var i = 0; i < 3 ; i++)
				if(m_Rooms[data.roomIdx][i]){
					info[i] = GetUserInfo(m_Rooms[data.roomIdx][i]);
					if(i == 2)
						info[2].status = STAT_OB;
				}
			//if(m_Rooms[data.roomIdx][0]) info[0] = GetUserInfo(m_Rooms[data.roomIdx][0]);
			//if(m_Rooms[data.roomIdx][1]) info[1] = GetUserInfo(m_Rooms[data.roomIdx][1]);
			this.emit("roomInfo", info);
		}else{
			this.emit("joinRoomError", '');
		}
	}	
	
	//离开房间
	var OnLeaveRoom = function(data){
		var sid = this.id;
		if(m_Connections[sid] && m_Connections[sid].roomIdx != -1 && 
			m_Connections[sid].roomIdx == data.roomIdx)
		{
			var roomIdx = m_Connections[sid].roomIdx;
			var posIdx  = m_Connections[sid].posIdx;
			m_Rooms[roomIdx][posIdx] = 0;
			m_Connections[sid].roomIdx = -1;
			m_Connections[sid].posIdx = -1;
			m_Connections[sid].status = STAT_NORMAL;
			
			//通知大厅人有人离开
			io.sockets.emit("leaveRoom", {
				"id" 	   : sid,
				"roomIdx"  : roomIdx,
				"posIdx"   : posIdx
			});
		}
	}
	
	//准备
	var OnReady = function(data){
		var sid = this.id;
		if(m_Connections[sid] && m_Connections[sid].roomIdx != -1 && 
			m_Connections[sid].status != STAT_START)
		{
			var status = 1 - m_Connections[sid].status;
			var roomIdx = m_Connections[sid].roomIdx;
			m_Connections[sid].status = status;
			
			//发送准备信息到大厅
			io.sockets.emit("ready", {
				"id"      : sid,
				"roomIdx" : roomIdx,
				"posIdx"  : m_Connections[sid].posIdx,
				"nickname": m_Connections[sid].nickname,
				"status"  : status
			});			
			
			//发送开始消息
			if(m_Rooms[roomIdx][0] && m_Rooms[roomIdx][1] && 
				m_Connections[m_Rooms[roomIdx][0]] && 
				m_Connections[m_Rooms[roomIdx][1]] && 
				m_Connections[m_Rooms[roomIdx][0]].status == STAT_READY &&
				m_Connections[m_Rooms[roomIdx][1]].status == STAT_READY)
			{
				//告诉两名玩家游戏正式开始
				m_Connections[m_Rooms[roomIdx][0]].status = STAT_START;
				m_Connections[m_Rooms[roomIdx][1]].status = STAT_START;
				m_Connections[m_Rooms[roomIdx][0]].socket.emit("start", {
					"color" : COLOR_BLACK,
					"allowDraw" : true
				});
				m_Connections[m_Rooms[roomIdx][1]].socket.emit("start", {
					"color" : COLOR_WHITE,
					"allowDraw" : false
				});
				
				//通知大厅的成员有游戏开始了
				io.sockets.emit("startInfo", {
					"roomIdx" : roomIdx,
					"player1" : m_Rooms[roomIdx][0],
					"player2" : m_Rooms[roomIdx][1]
				});
			}		
		}
	}
	
	//落子
	var OnDrawChess = function(data){ //服务器收到的前端落子消息后的处理
		console.log("x is " + data.x + "y is " + data.y);
		var sid     = this.id;
		var roomIdx = m_Connections[sid].roomIdx;
		//var nextdrawdata = {};
		data.nextdrawgridid = [0,1,2,3];
	    //data.nextdraw = y;
		if(true) //这里修改为不判断了
		{
			data.id = sid;
			m_RoomData[roomIdx][data.x][data.y] = data.color;
			
			for(var i = 0; i < 3; i++){//向房间内所有成员发送落子信息

				console.log("data is " + data);
				if(m_Connections[m_Rooms[roomIdx][i]]){//add by wangjia
					m_Connections[m_Rooms[roomIdx][i]].socket.emit("drawChess", data);
				}

			}
			
			//结束游戏?
			if(checkGameOver(roomIdx, data.x, data.y) == true){
				var first  = m_Rooms[roomIdx][0];
				var second = m_Rooms[roomIdx][1];
				var winer  = (sid == first ? first : second);
				var loser  = (sid == second ? first : second);
				m_Connections[first].status = STAT_NORMAL;
				m_Connections[second].status = STAT_NORMAL;
				ResetCheseData(roomIdx);
				m_Connections[winer].socket.emit("winer", "");	
				m_Connections[loser].socket.emit("loser", "");	

				//通知大厅的成员有游戏结束了
				io.sockets.emit("overInfo", {
					"roomIdx" : roomIdx,
					"player1" : first,
					"player2" : second
				});				
			}
		}
	}
	
	//检查落子是否合法，现在修改为在3*3的高亮区域
	var checkValidChess = function(roomIdx, x, y){
		if(m_RoomData[roomIdx][x][y] == 1){
			return false;
		}
		return true;
	}
	
	//检查游戏是否结束
	var checkGameOver = function(roomIdx, x, y){
		/*
		var n;
		var cur = m_RoomData[roomIdx][x][y];
		
		//横
		n = 0;
		var startX = (x - 4) < 0 ? 0 : x - 4;
		var endX   = (x + 4) > 14 ? 14 : x + 4;		
		for(var i = startX; i <= endX; i++){
			if(m_RoomData[roomIdx][i][y] == cur){
				n++;
			}else{
				n = 0;
			}
			if(n >= 5) return true;
		}
		
		//竖
		n = 0;
		var startY = (y - 4) < 0 ? 0 : x - 4;
		var endY   = (y + 4) > 14 ? 14 : y + 4;		
		for(var i = startY; i <= endY; i++){
			if(m_RoomData[roomIdx][x][i] == cur){
				n++;
			}else{
				n = 0;
			}
			if(n >= 5) return true;
		}
		
		//正斜
		n = 0;
		var min = x < y ? (x - 4 < 0 ? x : 4) : (y - 4 < 0 ? y : 4);
		var max = x > y ? (x + 4 > 14 ? 14 - x : 4) : (y + 4 > 14 ? 14 - y : 4); 
		var p1x = x - min;
		var p1y = y - min;
		var p2x = x + max;
		var p2y = y + max;
		for(var i = p1x, j = p1y; i <= p2x, j <= p2y; i++, j++){
			if(m_RoomData[roomIdx][i][j] == cur){
				n++;
			}else{
				n = 0;
			}
			if(n >= 5) return true;
		}
		
		//反斜
		n = 0;
		var min = (x + 4 > 14 ? 14 - x : 4) < (y - 4 < 0 ? y : 4) ? 
				  (x + 4 > 14 ? 14 - x : 4) : (y - 4 < 0 ? y : 4);
		var max = (x - 4 < 0 ? x : 4) < (y + 4 > 14 ? 14 - y : 4) ?
				  (x - 4 < 0 ? x : 4) : (y + 4 > 14 ? 14 - y : 4);
		var p1x = x + min;
		var p1y = y - min;
		var p2x = x - max;
		var p2y = y + max;
		for(var i = p1x, j = p1y; i >= p2x; i--, j++){
			if(m_RoomData[roomIdx][i][j] == cur){
				n++;
			}else{
				n = 0;
			}
			if(n >= 5) return true;
		}
		*/
		return false;
	}
	
	//发送消息
	var OnMessage = function (data) {
		var sid = this.id;
		if(!m_Connections[sid]) return;
		
		var cli = m_Connections[sid];
		var msg = {
			type : data.type,
			id : cli.socket.id,
			nickname : cli.nickname,
			body : data.body
		};
		switch(data.type){
			case MSG_ALL://所有人消息
				if(data.body){
					io.sockets.emit("message", msg);
				}
				break;
			case MSG_TO://发送消息到指定人
				if(data.to && data.body){
					m_Connections[data.to].socket.emit("message", msg);
				}
				break;
			case MSG_ROOM://房间
				if(cli.roomIdx > -1 && cli.roomIdx < m_Config.RoomTotal && data.body){
					for(var i = 0; i < 2; i++){
						if(m_Rooms[cli.roomIdx][i]){
							m_Connections[m_Rooms[cli.roomIdx][i]].socket.emit("message", msg);
						}
					}
				}
				break;
			default:
				break;
		}
	}
}