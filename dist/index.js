(()=>{var e={520:e=>{var t;function n(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}e.exports=Object.freeze((n(t={PLAYER_RADIUS:20,PLAYER_MAX_HP:100,PLAYER_SPEED:400,PLAYER_FIRE_COOLDOWN:.25,PLAYER:{RED_COLOR:"red",BLUE_COLOR:"blue"},BULLET_RADIUS:3,BULLET_SPEED:800,BULLET_DAMAGE:10,SCORE_BULLET_HIT:20,SCORE_PER_SECOND:1,PITCH:{X:1540,Y:840,FULL_X:1600,FULL_Y:900,RADIUS:50,PADDING_WIDTH:10,OUTLINE_WIDTH:20,GOAL_WIDTH:220,COLOR:"green",CANVAS_BACKGROUND_COLOR:"white",OUTLINE_COLOR:"red",CENTRAL_CIRCLE_RADIUS:160},BALL:{MASS:50,RADIUS:7,COLOR:"white"}},"PLAYER_RADIUS",10),n(t,"SERVER_PING",10),n(t,"MSG_TYPES",{JOIN_GAME:"join_game",GAME_UPDATE:"update",INPUT:"input",GAME_OVER:"dead",PING:"ping"}),t))}},t={};function n(o){var I=t[o];if(void 0!==I)return I.exports;var r=t[o]={exports:{}};return e[o](r,r.exports,n),r.exports}n.d=(e,t)=>{for(var o in t)n.o(t,o)&&!n.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:t[o]})},n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t);var o={};(()=>{"use strict";n.d(o,{m:()=>l});var e=n(520);var t={KeyW:{pressed:!1,func:function(t){var n={x:0,y:-t};socket.emit(e.MSG_TYPES.INPUT,n)}},KeyS:{pressed:!1,func:function(t){var n={x:0,y:t};socket.emit(e.MSG_TYPES.INPUT,n)}},KeyD:{pressed:!1,func:function(t){var n={x:t,y:0};socket.emit(e.MSG_TYPES.INPUT,n)}},KeyA:{pressed:!1,func:function(t){var n={x:-t,y:0};socket.emit(e.MSG_TYPES.INPUT,n)}}};document.addEventListener("keydown",(function(e){t[e.code]?t[e.code].pressed=!0:console.log(e.code)})),document.addEventListener("keyup",(function(e){t[e.code]&&(t[e.code].pressed=!1)})),n(520);var I,r=n(520),T=document.getElementById("canvas"),a={y1:(r.PITCH.Y-r.PITCH.GOAL_WIDTH)/2+r.PITCH.OUTLINE_WIDTH+r.PITCH.PADDING_WIDTH,y2:r.PITCH.GOAL_WIDTH,x11:r.PITCH.PADDING_WIDTH,x12:r.PITCH.OUTLINE_WIDTH,x21:r.PITCH.X+r.PITCH.OUTLINE_WIDTH+r.PITCH.PADDING_WIDTH,x22:r.PITCH.OUTLINE_WIDTH};function c(e,t,n,o,I,r,T,a){if(void 0===a&&(a=!0),void 0===r&&(r=5),"number"==typeof r)r={tl:r,tr:r,br:r,bl:r};else{var c={tl:0,tr:0,br:0,bl:0};for(var i in c)r[i]=r[i]||c[i]}e.beginPath(),e.moveTo(t+r.tl,n),e.lineTo(t+o-r.tr,n),e.quadraticCurveTo(t+o,n,t+o,n+r.tr),e.lineTo(t+o,n+I-r.br),e.quadraticCurveTo(t+o,n+I,t+o-r.br,n+I),e.lineTo(t+r.bl,n+I),e.quadraticCurveTo(t,n+I,t,n+I-r.bl),e.lineTo(t,n+r.tl),e.quadraticCurveTo(t,n,t+r.tl,n),e.closePath(),T&&e.fill(),a&&e.stroke()}function i(e,t,n,o,I,r,T){e.beginPath(),e.arc(t,n,o,0,2*Math.PI,!1),I&&(e.fillStyle=I,e.fill()),r&&(e.lineWidth=T,e.strokeStyle=r,e.stroke())}function P(){I.clearRect(0,0,T.width,T.height),I.fillStyle=r.PITCH.OUTLINE_COLOR,c(I,r.PITCH.PADDING_WIDTH,r.PITCH.PADDING_WIDTH,r.PITCH.X+2*r.PITCH.OUTLINE_WIDTH,r.PITCH.Y+2*r.PITCH.OUTLINE_WIDTH,r.PITCH.RADIUS,!0,!1),I.fillStyle=r.PITCH.COLOR,c(I,r.PITCH.PADDING_WIDTH+r.PITCH.OUTLINE_WIDTH,r.PITCH.PADDING_WIDTH+r.PITCH.OUTLINE_WIDTH,r.PITCH.X,r.PITCH.Y,r.PITCH.RADIUS,!0,!1),I.beginPath(),I.arc(r.PITCH.FULL_X/2,r.PITCH.FULL_Y/2,r.PITCH.CENTRAL_CIRCLE_RADIUS,0,2*Math.PI,!0),I.stroke(),I.clearRect(a.x11,a.y1,a.x12,a.y2),I.clearRect(a.x21,a.y1,a.x22,a.y2),i(I,l.ball.x,l.ball.y,r.BALL.RADIUS,r.BALL.COLOR,"black",1),l.players.forEach((function(e){i(I,e.x,e.y,r.PLAYER_RADIUS,1==e.team?r.PLAYER.BLUE_COLOR:r.PLAYER.RED_COLOR,"red",1)}))}var E,l,_=n(520),L=document.getElementById("ping"),s=document.getElementById("nickname_form"),d=document.getElementById("start_game_button"),D=(document.getElementById("body"),document.createElement("table"),document.createElement("tbody"),!1);socket.on(_.MSG_TYPES.PING,(function(e){D=!0,L.innerHTML="Ping: "+(Date.now()-e)+" ms"})),socket.on(_.MSG_TYPES.GAME_UPDATE,(function(e){l=e,requestAnimationFrame(P)})),document.getElementById("start_game_button").addEventListener("click",(function(){s.style.display="none",d.style.display="none",canvas.style.background="grey",setInterval((function(){Object.keys(t).forEach((function(e){t[e].pressed&&t[e].func(10)}))}),50),(I=T.getContext("2d")).canvas.width=1600,I.canvas.height=900,console.log("Game screen inicializated: "+I.canvas.width+"x"+I.canvas.height),E=s.value,socket.emit(_.MSG_TYPES.JOIN_GAME,E)}),!1),socket.on("ping",(function(e){D=!0,L.innerHTML="Ping: "+(Date.now()-e)+" ms"})),setInterval((function(){D=!1,socket.emit("ping",Date.now()),D||(L.innerHTML="Connection lost")}),500)})()})();