//首先规定一个最小方格的长宽都是gridlen
var gridlen = 75;
init(30,"mylegend",(gridlen*9),(gridlen*9 + 30),main); //speed,divid,width,height,completeFunc-callback

var backLayer,chessLayer,overLayer;
var statusText = new LTextField();
var statusContent="you first……";
var matrix = [                 //3*3 chessboard
	[0,0,0],
	[0,0,0],
	[0,0,0]
	
]; 
function GridObj() 
{
	this.grid33 = [                 //3*3 chessboard
	[0,0,0],
	[0,0,0],
	[0,0,0]
	
];
	this.step = 0;
}; //对象建立，3*3matrix，matrix序号ind属于[0,8]，

var singleGrid = new Array();
for(var ii = 0; ii < 9; ii++) //9个grid初始化
{
	singleGrid[ii] = new GridObj();
}

var usersTurn = true;
var step = 0;  //当前步数
var currGridIndex = 0; //当前grid3*3的序列号
var title = "TTT";
var introduction = " 3*3*9 TTT"
var infoArr = [title,introduction];

function main()
{
	gameInit(); //棋盘精灵和落子事件注册
	addText(); //文字添加
	addLattice();//棋盘ui添加	 
}
function gameInit()
{
	initLayer();
	addEvent();
}
function initLayer()
{
	backLayer = new LSprite();
	addChild(backLayer);

	chessLayer = new LSprite();
	backLayer.addChild(chessLayer);

	overLayer = new LSprite();
	backLayer.addChild(overLayer);
}

function addEvent()//监听事件添加
{ 
	backLayer.addEventListener(LMouseEvent.MOUSE_DOWN,onDown);
}
function onDown()
{
	var mouseX,mouseY;
	mouseX = event.offsetX;
	mouseY = event.offsetY;
	var partindex ;

	var partX = Math.floor(mouseX/gridlen);//每个grid的长宽都是gridlen
	var partY = Math.floor(mouseY/gridlen);
	 // 第一行三个3*3单元的鼠标位置判断 , 通过坐标和偏移确保partXY都在[0,2]范围内
	if((partX <= 2)                && (partY <= 2)) 
		partindex = 0;
	if(((partX > 2)&&(partX <= 5)) && (partY <= 2))
	{
		partindex = 1; 
		partX = partX - 3;
	}
	if(((partX > 5)&&(partX <= 8)) && (partY <= 2)) 
	{
		partindex = 2; 
		partX = partX - 6;
	}
	// 第二行
 	if((partX <= 2)                && ((partY > 2) && (partY <= 5))) 
 	{
 		partindex = 3; 
 		partY = partY -3;
	}	
	if(((partX > 2)&&(partX <= 5)) && ((partY > 2) && (partY <= 5))) 
	{
		partindex = 4;
		partX = partX -3;
		partY = partY -3;
	}
	if(((partX > 5)&&(partX <= 8)) && ((partY > 2) && (partY <= 5))) 
	{
		partindex = 5;
		partX = partX - 6;
		partY = partY - 3;
	}
	// 第三行
 	if((partX <= 2)                &&((partY > 5)&&(partY <= 8))) 
 	{
 		partindex = 6; 
 		partY = partY - 6;
	}
	if(((partX > 2)&&(partX <= 5)) &&((partY > 5)&&(partY <= 8)))
	{ 
		partindex = 7;
		partX = partX - 3;
		partY = partY - 6;
	}
	if(((partX > 5)&&(partX <= 8)) &&((partY > 5)&&(partY <= 8)))
	{ 
		partindex = 8;
		partX = partX - 6;
		partY = partY - 6;
	}
	console.log('aaaaa'+ partX,partY,partindex);

	//鼠标点击位置为未落子之处
	//并且此3*3单元是当前处理单元
	if((singleGrid[currGridIndex].grid33[partX][partY]==0)&&(currGridIndex == partindex))
	{ 
		usersTurn=false;
		singleGrid[currGridIndex].grid33[partX][partY]=-1; //用户落子后，此位置的matrix中数值变为-1
		
		step++;

		update(partX,partY,currGridIndex);

		console.log('step ==' + step + 'gridindex == '+currGridIndex);
		if((step >= 9) && (currGridIndex < 8))
		{
			step = 0;
			currGridIndex++;
		}
		
		/*
		if(win(partX,partY)){
			statusContent = "帅呆了，你赢啦！点击屏幕重开游戏。";
			gameover();
			addText();
		}else if(isEnd()){
			statusContent = "平局啦~~点击屏幕重开游戏。";
			gameover();
			addText();
		}else{
			statusContent = "电脑正在思考中……";
			addText();
			computerThink();
		}
		*/
	}
}
function addText(){
	statusText.size = 15;	
	statusText.weight = "bold";
	statusText.color = "white";
	statusText.text = statusContent;
	statusText.x = (LGlobal.width-statusText.getWidth())*0.5;
	statusText.y = gridlen*8;
	
	overLayer.addChild(statusText);
}
function addLattice(){
	//backLayer.graphics.drawRect(10,"dimgray",[0,0,675,705],true,"dimgray");//线宽，颜色，起始坐标xy,结束坐标xy，是否填充，填充颜色
	backLayer.graphics.drawRect(10,"#006633",[0,0,675,675],true,"#99CC99");//同上，棋盘边框和内部填充颜色
	for(var i=0;i<9;i++){
		backLayer.graphics.drawLine(3,"#006633",[gridlen*i,0,gridlen*i,675]); //竖线，参数说明：线宽，颜色，起始坐标xy，结束坐标xy
		if(!(i%3))
			backLayer.graphics.drawLine(3,"#993333",[gridlen*i,0,gridlen*i,675]); //竖线，参数说明：线宽，颜色，起始坐标xy，结束坐标xy

	}
	for(var i=0;i<9;i++){
		backLayer.graphics.drawLine(3,"#006633",[0,gridlen*i,675,gridlen*i]); //横线
		if(!(i%3))
			backLayer.graphics.drawLine(3,"#993333",[0,gridlen*i,675,gridlen*i]); //横线
	}

}

//将index编号0-8 转变为X坐标偏移,偏移单位为最小棋盘方格的个数，亦即gridlen
function transIndexToBiasX(i)
{
	var bias = 0;
	if((0 == i)||(3 == i) || (6 == i))
		bias = 0;
	else if((1 == i)||(4 == i) || (7 == i))
		bias = 1*3;
	else if((2 == i)||(5 == i) || (8 == i))
		bias = 2*3;

	return bias;
}

//将index编号0-8 转变为Y坐标偏移
function transIndexToBiasY(i)
{
	var bias = 0;
	if((0 == i)||(1 == i) || (2 == i))
		bias = 0;
	else if((3 == i)||(4 == i) || (5 == i))
		bias = 1*3;
	else if((6 == i)||(7 == i) || (8 == i))
		bias = 2*3;
	
	return bias;
}

//对弈落子实现,x,y为matrix中的xy坐标,i为matrix序号
function update(x,y,i){
	var v = singleGrid[i].grid33[x][y];
	if(0){ //v > 0 显示用户下的此步旗子O
		////画圆弧参数说明:线宽/颜色/[圆心坐标/半径/起始角/跨过角度/是否顺时针]/是否填充/填充颜色
		//用户选择的圈圈显示
		chessLayer.graphics.drawArc(12,"green",
			[
			 (x + transIndexToBiasX(i))*gridlen+gridlen/2,
			 (y + transIndexToBiasY(i))*gridlen+gridlen/2,
			 22,
			 0,
			 2*Math.PI
			 ]);
	}else if(1){ // v < 0 时用户落子完毕，draw CPU的此步旗子X
		chessLayer.graphics.drawLine(12,"#FFCC00",
			[
			gridlen*(x + transIndexToBiasX(i))+16,
			gridlen*(y + transIndexToBiasY(i))+16,
			gridlen*((x + transIndexToBiasX(i))+1)-16,
			gridlen*((y + transIndexToBiasY(i))+1)-16
			]);
		chessLayer.graphics.drawLine(12,"#FFCC00",
			[
			gridlen*((x + transIndexToBiasX(i))+1)-16,
			gridlen*(y + transIndexToBiasY(i))+16,
			gridlen*(x + transIndexToBiasX(i))+16,
			gridlen*((y + transIndexToBiasY(i))+1)-16
			]);
	}
}
function computerThink(){
	var b = best();
	var x = b.x;
	var y = b.y;
	matrix[x][y]=1;
	step++;
	update(x,y,currGridIndex);
	
	if(win(x,y)){
		statusContent = "哈哈你输了！点击屏幕重开游戏。";
		gameover();
		addText();
	}else if(isEnd()){
		statusContent = "平局啦~~点击屏幕重开游戏。";
		gameover();
		addText();
	}else{
		statusContent = "该你了！！！";
		addText();
	}
}
function isEnd(){
	return step>=9*9; 
}
function smallwin(x,y,n){ //一个单位3*3的胜负,n为单位序列号
	if(Math.abs(matrix[x][0]+matrix[x][1]+matrix[x][2])==3){ 
		return true;
	}
	if(Math.abs(matrix[0][y]+matrix[1][y]+matrix[2][y])==3){
		return true;
	}
	if(Math.abs(matrix[0][0]+matrix[1][1]+matrix[2][2])==3){
		return true;
	}
	if(Math.abs(matrix[2][0]+matrix[1][1]+matrix[0][2])==3){
		return true;
	}
	return false;
}
function best(){
	var bestx;
	var besty;
	var bestv=0;
	for(var x=0;x<3;x++){
		for(var y=0;y<3;y++){
			if(matrix[x][y]==0){
				matrix[x][y] = 1;
				step++;
				if(win(x,y)){
					step--;
					matrix[x][y] = 0;	
					return {'x':x,'y':y,'v':1000};
				}else if(isEnd()){
					step--;
					matrix[x][y]=0;	
					return {'x':x,'y':y,'v':0};
				}else{
					var v=worst().v;
					step--;
					matrix[x][y]=0;
					if(bestx==null || v>=bestv){
						bestx=x;
						besty=y;
						bestv=v;
					}
				}
			}
		}
	}
	return {'x':bestx,'y':besty,'v':bestv};
}
function worst(){
	var bestx;
	var besty;
	var bestv = 0;
	for(var x=0;x<3;x++){
		for(var y=0;y<3;y++){
			if(matrix[x][y] == 0){
				matrix[x][y] = -1;
				step++;
				if(win(x,y)){
					step--;
					matrix[x][y] = 0;	
					return {'x':x,'y':y,'v':-1000};
				}else if(isEnd()){
					step--;
					matrix[x][y]=0;	
					return {'x':x,'y':y,'v':0};;
				}else{
					var v=best().v;
					step--;
					matrix[x][y]=0;
					if(bestx==null || v<=bestv){
						bestx=x;
						besty=y;
						bestv=v;
					}
				}
				
			}
		}
	}
	return {'x':bestx,'y':besty,'v':bestv};
}
function gameover(){
	backLayer.removeEventListener(LMouseEvent.MOUSE_DOWN,onDown);
	backLayer.addEventListener(LMouseEvent.MOUSE_DOWN,function(){
		chessLayer.removeAllChild();
		backLayer.removeChild(chessLayer);
		backLayer.removeChild(overLayer);
		removeChild(backLayer);
		matrix = [                 //3*3*9 chessboard,the last one is result matrix
	[0,0,0],
	[0,0,0],
	[0,0,0]
	
][10];
		step = 0;
		main();
		statusContent = "您先请吧……";
		addText();
	});
}