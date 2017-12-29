var commandHistory = ["begin"]
var blackTheme = (getCookie("theme") == "true");
setTheme();

const jInput = $("#input")
const jOverlay = $("#overlay");

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

var selectionIndex = -1; // for command selection
const inputModes = {default: 0, room: 1, name: 2}
var inputMode = 0;
resetInput();
jInput.keyup(function(e){
	if (inputMode == inputModes.default){
		if (e.keyCode == 27) { // esc
			jInput.val("");
			selectionIndex = -1; // reset command selection
		} else if (e.keyCode == 38) { // up arrow
			if(selectionIndex < commandHistory.length-1)
				selectionIndex++;
			jInput.val(commandHistory[selectionIndex]);
		} else if (e.keyCode == 40) { // down arrow
			if(selectionIndex > -1){
				selectionIndex--;
				jInput.val(commandHistory[selectionIndex]);
			} else {
				jInput.val("");
			}
		} else if (e.keyCode == 13) { // enter
			e.preventDefault();
			if(jInput.val() !== ""){
				commandHistory.unshift(jInput.val()); // add command to history
				socket.emit("command", commandHistory[0]);
				jInput.val("");
			}
		} else if (e.keyCode in []){return} // cancel if ctrl, shift, etc
	} else if (e.keyCode == 27){ // esc
		resetInput();
	} else if (e.keyCode == 13){ // enter
		e.preventDefault()
		if (inputMode == inputModes.room){
			socket.emit("leave room");
			room = jInput.val();
			window.history.pushState(room, "mao - " + room, "/room/" + room);
			console.log("attempted to join room, " + room);
			socket.emit("join room", room);
		} else if (inputMode == inputModes.name){
			socket.emit("set username", jInput.val());
		}
		resetInput()
	}
	
	console.log("key: " + e.keyCode);

});

function resetInput() {
	selectionIndex = -1;
	jInput.val("");
	inputMode = 0;
	jOverlay.finish().fadeOut("fast");
	jInput.attr('placeholder', 'chit chat');
}

function output2(str, format) {
	if(format == FORMAT.IMPORTANT)
		$("#output").append("<li class='animated infinite pulse'>" + str + "</li>");
	else if(format == FORMAT.DEBUG)
		$("#output").append("<li class='code'>" + str + "</li>");
	else if(format == FORMAT.ERROR)
		$("#output").html("<li class='animated bounce error'" + str + "</li>")
	else
		$("#output").html("<li>" + str + "</li>");
}

function output(data){
	if(data.format === undefined) data.format = "";
	else if (data.format === "penalty"){
		// self gets a penalty.
		if(socket.id == data.id){
		//	$(body)
		//	$(body).css({"background": "red"}).delay
		}

	}

	$("#messages").append("<li>" + data.name + " <span class='message-body " + data.format + "'>" + data.message + "</span></li>");
	$("#cardstack-" + data.id + " .cardstack-message").finish().fadeIn("fast").html("<span class='message-body " + data.format + "'>" + data.message + "</span>").delay(3000).fadeOut("fast");
}

function focus() {
	jInput.focus();
}

function init() {
	focus();
}

$("main").click(function(){
	focus();
	$("nav").slideUp();
});

$("#btn-settings").click(function(){
	focus();
	$("nav").slideDown();
});

$("#btn-close-settings").click(function(){
	focus();
	$("nav").slideUp();
});

$("#btn-theme").click(function(){
	focus();
	blackTheme = !blackTheme;
	setTheme();
});

$("#btn-room").click(function(){
	focus();
	inputMode = inputModes.room;
	jOverlay.finish().fadeIn();
	jInput.attr('placeholder', 'enter room...');
});

$("#btn-username").click(function(){
	focus();
	inputMode = inputModes.name;
	jOverlay.finish().fadeIn();
	jInput.attr('placeholder', 'enter new username...');
});

$("#btn-cancel").click(resetInput);

$("#btn-begin").click(function(){
	focus();
	$(this).finish().fadeOut("fast");
	socket.emit("begin");
})

var chatShown = false;
$("#btn-showchat").click(function(){
	if(chatShown){
		$("#btn-showchat i").removeClass("fa-angle-down").addClass("fa-angle-up");
		$("#output").finish().fadeOut();

	} else {
		$("#btn-showchat i").removeClass("fa-angle-up").addClass("fa-angle-down");
		$("#output").finish().fadeIn();
	}
	chatShown = !chatShown;
})

function updateUserCount(count){
	if(count === undefined)
		$("#info-online-count").html();
	else
		$("#info-online-count").html(count + " players in '" + room + "'");
};

var id;
const socket = io.connect("/");

// get room by URL
var room = "";
var cardstacks = [];
if(window.location.pathname.slice(0, 6) == "/room/")
	room = window.location.pathname.slice(6);

// socket.io debugging
//localStorage.debug = "*";

socket.on("connect", function() {
	$("#connection-info").addClass("connected");
	socket.emit("join room", room);
	try{
		$('meta[name=theme-color]').attr('content', '#266d26')
	} catch(e){};
	$("#info-online").html("connected");
	$("#info-id").html("id=" + socket.id);
});
// delete all cardstacks and remove begin
function resetDisplay() {
	$(".cardstack-container").remove();
	$("#btn-begin").finish().fadeOut("fast");
	cardstacks = [];
}

socket.on("reconnect", function(){
	console.log("reconnected!");
	socket.disconnect();
	location.reload(true);
	//socket.emit("leave room");
	// Because of this, when the server is killed,
	// bizzare things happen
	// (hands don't show up)
	//socket.emit("join room", room);
	// TODO: handle continue
	// this is very broken atm
})

socket.on("disconnect", function() {
	$("#connection-info").removeClass("connected");
	$('meta[name=theme-color').attr('content', '#6d2626')
	$("#info-online").html("disconnected");
	updateUserCount();
});

socket.on("message", output);

socket.on("output", function(data) {
	output(data.str, data.format);
});

socket.on("refresh", function() {
	location.reload(true);
});

socket.on("user count", function(count) {
	updateUserCount(count);
});

socket.on("show begin", function(){
	$("#btn-begin").finish().fadeIn("fast");
})

socket.on("hide begin", function(){
	$("#btn-begin").finish().fadeOut("fast");
})

socket.on("clear table", function() {
	$(".cardstack-container").remove();
});

socket.on("reset display", resetDisplay);

$(document).ready(function() { init(); })

// exit warning DEBUG DISABLED
//window.onbeforeunload = function() {return true;};

window.onunload = function() {
	socket.disconnect();
};

socket.on("new cardstack", function(user){
	newCardStack(user);
	setTable();
});

socket.on("new cardstacks", function(data) {
	data.forEach(function(user){
		newCardStack(user);
	});
	setTable();
});
// list of ids by turn order
function newCardStack(data) {
	var drop = "";
	if(data.display == "user" || data.display == "pile")
		drop = ' ondrop="dropCard(event)" ondragover="allowDrop(event)"';
	var stack = $("#table").append('<div class="cardstack-container ' + data.display + '" id="' + data.id + '"' + drop + '><div class="cardstack-box"><div class="cardstack"></div></div><div class="cardstack-head"><h2 class="cardstack-title">' + data.title + '</h2><small class="cardstack-count"></small></div><div class="cardstack-message"></div></div>')
	if(data.display == "user"){
		$("#" + data.id + " .cardstack-head").click(function(){
			socket.emit("sort hand");
		});
	}
	if(data.display == "user" || data.display == "altuser"){
		cardstacks.push(data.id);
	}
}

function setTable(){
	var userIndex = -1;
	cardstacks.forEach(function(id, index){
		el = $("#" + id)
		if(userIndex > -1){
			if(index == userIndex+1)
				el.detach().prependTo("#altusers")
			else {
				el.detach().insertAfter("#altusers .cardstack-container:eq(" + (index - userIndex - 2) + ")");
			}
		} else if(id.replace("cardstack-", "") == socket.id) {
			userIndex = index;
		} else {
			el.detach().appendTo("#altusers");
		}
	});
}


socket.on("del cardstack", function(data){
	cardstacks.splice(cardstacks.indexOf(data.id), 1);
	$("#" + data.id).remove();
	setTable();
});

socket.on("display cardcount", function(data) {
	if(data.count === undefined || data.count == 0)
		$("#" + data.id + " .cardstack-count").html("");
	else
		$("#" + data.id + " .cardstack-count").html("(" + data.count + ")");
})

socket.on("clear cardstack", function(data) {
	$("#" + data.id + " .cardstack li").remove();
})

socket.on("rename user", function(data){
	$("#" + data.id + " .cardstack-title").html(data.name);
})


socket.on("display move card", function(data){
	var $target = $("#" + data.destination);
	var $card = $("#" + data.origin + " #" + data.cardID);

	var xT = $target.offset().left + $target.width() / 2 - $card.width() / 2;
	var yT = $target.offset().top + $target.height() / 2 - $card.height() / 2;

	$card.addClass('animated');
	var xE = $card.offset().left;
	var yE = $card.offset().top;
	// Initial conditions
	$card.detach().appendTo("#animation").css({"left": xE, "top": yE, "opacity": 1});
	setTimeout(function(){
		$card.css({"left": xT, "top": yT, "opacity": 0});
	}, 50)

	$("#" + data.destination + " .cardstack").prepend(displayCard(data.card, data.destination));
	var $card2 = $("#" + data.destination + " #" + data.cardID);
	$card2.hide();

	// when animation has completed
	// transitionend does not fire when tab is
	// out of focus.
	var hasFired = false;
	$card.one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function(e) {
		$card.remove();
		$card2.fadeIn("fast");
		hasFired = true;
	});

	setTimeout(function(){
		if(!hasFired){
			$card.remove();
			$card2.fadeIn("fast");
		}
	}, 1000);
})

socket.on("display remove card", function(data) {
	$("#" + data.id + " #" + data.cardID).remove();
});

socket.on("display card top", function(data) {
	$("#" + data.id + " .cardstack").prepend(displayCard(data.card, data.id));
});

socket.on("display card bottom", function(data) {
	$("#" + data.id + " .cardstack").append(displayCard(data.card, data.id));
});

socket.on("display cards", function(data) {
	for (index in data.cards){
		$("#" + data.id + " .cardstack").append(displayCard(data.cards[index], data.id));
	}
});

function displayCard(card, id) {
	var r = (Math.random()*8)-4;
	var x = (Math.random()*4)-2;
	var y = (Math.random()*4)-2;
	var transform = "transform: rotate("+r+"deg) translate(" + x + "px, " + y + "px); -webkit-transform: rotate("+r+"deg) translate(" + x + "px, " + y + "px); -moz-transform: rotate("+r+"deg) translate(" + x + "px, " + y + "px)";
	var draggable = false;
	var onClick = "";
	if ($("#" + id).hasClass("user") || $("#" + id).hasClass("deck")) {
		draggable = true;
		onClick = "' onclick='clickCard(event)";
	}
	return "<li class='card " + card.colour + "' id='" + card.id + onClick + "' draggable=" + draggable + " ondragstart='dragCard(event)' style='" + transform + "'>" + card.str + "</li>";
}
// Fixes touch screen drags (I think)
window.addEventListener('touchmove', function() {})

function clickCard(event){
	socket.emit("play card", {cardID: event.target.id, origin: event.path[3].id});
	focus();
}

///// Drag and drop functionality
function dragCard(event){
	// sets the data that is to be dragged, by the ID of the element.
	event.dataTransfer.setData("text\\plain", event.target.id + ";" + event.path[3].id);
	event.dataTransfer.dropEffect = "move";
	setTimeout(function() {event.target.style.opacity = .01}, 10);
	//console.log("dragging")
}

// Displays drop cursor
function allowDrop(event) {
	event.preventDefault(); // data/elements cannot be dropped in other elements by default
	// Set the dropEffect to move
 	event.dataTransfer.dropEffect = "move"
 	//console.log("allow drop")
}

// Reset opacity on cancel / mistake
document.addEventListener("dragend", function(event){
	event.target.style.opacity = 1;
	//console.log("dragend")
})

function dropCard(event){
	event.preventDefault(); // open as link on drop by default
	var data = event.dataTransfer.getData("text\\plain").split(";") // the ID of the dropped element
	if(data.length != 2) return false; // not a card

	var destination; // drag to container
	if(event.target.id == "") destination = event.path[2].id;
	else destination = event.path[3].id; // drag to card in container

	socket.emit("move card", {cardID: data[0], origin: data[1], destination: destination});
	// server handles the rest.
	//console.log("dropped")
	focus();
}




function setTheme() {
	if(blackTheme){
		$('link[rel=stylesheet][href~="/dark.css"]').removeAttr('disabled');
		$("#btn-theme").html("Light Theme")
	} else {
		$('link[rel=stylesheet][href~="/dark.css"]').attr('disabled', 'disabled');
		$("#btn-theme").html("Dark Theme")
	}
	document.cookie = ("theme=" + blackTheme)
}