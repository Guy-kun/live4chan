var chat = {};
var future_ids = {};
var quote_links_to = {};
var loaded_callbacks = [];
var convos = [];
var videos = {};

var admins = ["!/b/suPrEmE", "!KRBtzmcDIw"];
/* if you look at source you are essentially helping out, so have some blue colored trips! --> bluerules, testing */
var default_contribs = ["!7cNl93Dbb6", "!9jPA5pCF9c", "!iRTB7gU5ps"];
var my_ids = [];
var contribs = default_contribs;
var thumbnail_mode = "links-only";

function humanFileSize(bytes, si) {
    "use strict";
    var thresh = si ? 1000 : 1024;
    if (bytes < thresh) {
        return bytes + ' B';
    }
    var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (bytes >= thresh);
    return bytes.toFixed(1) + ' ' + units[u];
}

function quote_click() {
    $("#autoscroll").prop('checked', false);
}

function quote_mouseover() {
    var display = $("#chat_" + $(this).data("dest")).clone();
    display.toggleClass("to_die", true);
    display.css({
        display: 'inline',
        position: 'absolute',
        top: $(this).offset().top - $(this).height()/2,
        left: $(this).offset().left + $(this).width(),
        border: '1px black solid',
        zIndex: 1000
    });
    $('body').append(display);
}

function kill_excess() {
    "use strict";
    $('video.to_die')
        .removeClass("to_die")
        .each(function() {
            this.pause();
        })
        .css("display", "none");
    $('.to_die').remove();
}

function toggle_sidebar(){
	$('.sidebar').hide('slow');
}


function board_link(dest){
    var link = $("<a class='board_link'/>");
    link.text(">>>"+dest);
    link.css("text-decoration", "underline");
    link.click(function(){change_channel(dest);});
	return link;
}

function quote_link(dest) {
    "use strict";
    var link = $("<a class='quote_link'/>");
    link.attr("href", "#chat_" + dest);
    link.data("dest", dest);
    link.text(function () {
        return ">>" + dest + (($.inArray(dest, my_ids) > -1) ? " (You)" : "");
    });
    link.click(quote_click);
    link.mouseover(quote_mouseover);
    link.mouseout(kill_excess);
    if (quote_links_to[dest] === undefined) quote_links_to[dest] = [];
    quote_links_to[dest].push(link);
    return link;
}

function swap_to_convo(convo){
	if(convo=="") {
		$('#convo_filter').val('no-filter');
		$("#convo").val('');

	} else {
		$("#convo").val(convo);
		$('#convo_filter').val('filter');
	}
    apply_filter();
    scroll();
    return;
}

function draw_convos(){
    $('.sidebar:first').empty();

    var div = $("<div class='sidebar_convo'>All</div>");
    div.click(function() {
        swap_to_convo("");
    });
    $('.sidebar:first').append(div);

    for (var i = 0; i < convos.length && i < 30; i++) {
        div = $("<div class='sidebar_convo'/>");
        div.text(convos[convos.length - 1 - i]);
        div.click(function() {
            swap_to_convo($(this).text());
        });
        $('.sidebar:first').append(div);
    }
}

function generate_post(id) {
    "use strict";
    var post = $(
        "<article class='chat'>" +
            "<header class='chat_header'>" +
                "<a class='chat_label' style='display: none;'/>" +
                "<output class='chat_name'><output class='name_part'/><output class='trip_code'/></output>" +
                "<output class='chat_convo'/>" +
                "<output class='chat_date'/>" +
                "<output class='chat_number'/>" +
                "<output class='chat_refs'/>" +
            "</header>" +
            "<section class='chat_file' style='display: none;'>" +
                "File: <a class='file_link' target='_blank'/>" +
                "<output class='file_data'/>" +
            "</section>" +
            "<a target='_blank' class='chat_img_cont'/>" +
            "<output class='chat_body'/>" +
        "</article>"
    );
    post.attr("id", "chat_" + id);

    if (chat_id === "all") {
        post.find(".chat_label")
            .css("display", "inline")
            .attr("href", "/chat/" + chat[id].chat);
    }

    post.find(".chat_convo")
        .mouseover(quote_mouseover)
        .mouseout(kill_excess)
        .click(function () {
            $("#convo").val(chat[id].convo);
            apply_filter();
        });

    post.find(".chat_number")
        .text(id)
        .click(function () {
            quote(id);
        });

    if (future_ids[id] !== undefined) {
        post.find(".chat_refs").append(" ", future_ids[id].contents());
    }

    post.find(".chat_img_cont")
        .mouseover(function(event) {
            if (!chat[id].image || chat[id].image_width === undefined || chat[id].image_height === undefined) return;
            var maxLeft = $(this).offset().left + $(this).width() + 10;
            var maxWidth = $(window).width() - maxLeft;
            if (maxWidth <= 0) return;
            var maxHeight = $(window).height();
            var scale = Math.min(maxWidth/chat[id].image_width, maxHeight/chat[id].image_height, 1);
            var width = Math.round(chat[id].image_width * scale);
            var height = Math.round(chat[id].image_height * scale);
            var left = Math.min(event.clientX + 10, maxLeft);
            var top = Math.round((maxHeight - height) * event.clientY / maxHeight);

            var base_name = chat[id].image.match(/[\w\-\.]*$/)[0];
            var extension = base_name.match(/\w*$/)[0];
            if ($.inArray(extension, ["ogv", "webm"]) > -1) {
                var display = videos[id];
                if (display === undefined) {
                    display = $("<video/>");
                    videos[id] = display;
                }
                display[0].loop = true;
                display[0].muted = (localStorage.hoversound !== "true");
            } else {
                var display = $("<img>");
            }
            display.attr("src", "/tmp/uploads/" + base_name);
            display.toggleClass("to_die", true);
            display.css({
                display: 'inline',
                position: 'fixed',
                left: left,
                top: top,
                width: width,
                height: height,
                zIndex: 1000,
                'pointer-events': 'none'
            });
            if (!display.parent().is("body")) $('body').append(display);
            if (display.is("video")) display[0].play();
        })
        .mousemove(function(event) {
            var display = $(".to_die");
            if (display.length == 0) return;
            var maxLeft = $(this).offset().left + $(this).width() + 10;
            var maxHeight = $(window).height();
            var left = Math.min(event.clientX + 10, maxLeft);
            var top = Math.round((maxHeight - display.height()) * event.clientY / maxHeight);
            $(".to_die").css({
                left: left,
                top: top,
            });
        })
        .mouseout(kill_excess);

    return post;
}

function markup(text, rules) {
    "use strict";
    var output = [];
    do {
        var match = null;
        var pos = text.length;
        var f = null;
        $.each(rules, function() {
            var result = this[0].exec(text);
            if (result !== null && result.index < pos) {
                match = result;
                pos = result.index;
                f = this[1];
            }
        });
        output.push(document.createTextNode(text.substr(0, pos)));
        if (match !== null) {
            f(match, output);
            text = text.substr(pos + match[0].length);
        }
    } while (match !== null);
    return output;
}



function update_chat(new_data, first_load) {
    "use strict";
    var id = new_data.count;
    if (id === undefined) {
    	return;
    }
    var new_post = (chat[id] === undefined);
    var post = null;
    if (new_post) {
        chat[id] = new_data;
        post = generate_post(id);
    } else {
        var key = null;
        for (key in new_data) {
            if (chat[id][key] === new_data[key]) {
                delete new_data[key];
            } else {
                chat[id][key] = new_data[key];
            }
        }
        post = $("#chat_" + id);
    }

    var data = chat[id];
    if (new_data.chat !== undefined && chat_id === "all") {
        post.find(".chat_label").text("/" + data.chat);
    }
    if (new_data.name !== undefined) {
        post.find(".name_part").text(data.name);
    }
    if (new_data.trip !== undefined) {
        post.find(".trip_code").text(data.trip);
        var contrib = ($.inArray(data.trip, contribs) > -1);
        var admin = ($.inArray(data.trip, admins) > -1);
        post.find(".chat_name")
            .toggleClass("contrib", contrib && !admin)
            .toggleClass("admin", admin);
    }
    if (new_data.convo !== undefined || new_data.convo_id !== undefined) {
        var is_op = (data.convo_id === data.count);
        post.toggleClass("convo_op", is_op);
        var chat_convo = post.find(".chat_convo");
        chat_convo.text(data.convo + (is_op ? " (OP)" : ""));
        if (!is_op) chat_convo.data("dest", data.convo_id);
    }
    if (new_data.date !== undefined) {
        var date = new Date(data.date);
        date = (date == "NaN") ? data.date : date.toLocaleString();
        post.find(".chat_date").text(date);
    }
    if (new_data.image !== undefined || new_data.thumb !== undefined) {
        post.find(".chat_file").css("display", data.image ? "block" : "none");
        var img_container = post.find(".chat_img_cont");
        img_container.empty();
        if (data.image) {
            var base_name = data.image.match(/[\w\-\.]*$/)[0];
            var extension = base_name.match(/\w*$/)[0];
            var url_image = "/tmp/uploads/" + base_name;

            post.find(".file_link")
                .attr("href", url_image)
                .text(base_name);

            var url_static = null;
            if (data.thumb) {
                url_static = "/tmp/thumb/" + data.thumb.match(/[\w\-\.]*$/)[0];
            } else if ($.inArray(extension, ["gif", "ogv", "webm"]) === -1) {
                url_static = url_image;
            }
            var url_anim = url_static;
            if (extension === "gif") {
                url_anim = url_image;
            }

            img_container.attr("href", url_image);
            if (url_static !== null) {
                img_container.append($("<img class='chat_img thumb_static'>").attr("src", url_static));
            }
            if (url_anim !== null) {
                img_container.append($("<img class='chat_img thumb_anim'>").attr("src", url_anim));
            }
            img_container.find(".chat_img")
                .css("display", "none")
                .attr("alt", "Image #" + data.count);

            if (thumbnail_mode === "static") img_container.find(".thumb_static").css("display", "inline");
            if (thumbnail_mode === "animated") img_container.find(".thumb_anim").css("display", "inline");
        }
    }
    if (new_data.image !== undefined || new_data.image_filesize !== undefined || new_data.image_width !== undefined || new_data.image_height !== undefined || new_data.image_filename !== undefined) {
        var data_items = [];
        if (data.image_filesize !== undefined) {
            data_items.push(humanFileSize(data.image_filesize, false));
        }
        if (data.image_width !== undefined && data.image_height !== undefined) {
            data_items.push(data.image_width + "x" + data.image_height);
        }
        if (data.image_filename !== undefined) {
            data_items.push(data.image_filename);
        }
        if (data_items.length > 0) {
            post.find(".file_data").text("-(" + data_items.join(", ") + ")");
        } else {
            post.find(".file_data").text("");
        }
    }
    if (new_data.body !== undefined) {
        // Remove any old backlinks to this post
        if (quote_links_to[id] !== undefined) {
            $.each(quote_links_to[id], function() {
                if (this.hasClass("back_link")) this.remove();
            });
        }

        // Process body markup
        var ref_ids = [];
        var quote_links = [];
        var rules = [
        	[/(\r?\n)?(?:\{(\d+)\}|>>>([\/a-z0-9]+))/, function(m, o) {
                /*if (m[1]) o.push($("<br>"));
                var ref_id = parseInt(m[2] ? m[2] : m[3], 10);
                if ($.inArray(ref_id, ref_ids) === -1) ref_ids.push(ref_id);
                o.push(quote_link(ref_id));*/
                o.push(board_link(m[3]));
                console.log(m,o);
            }],
            [/(\r?\n)?(?:\{(\d+)\}|>>(\d+))/, function(m, o) {
                if (m[1]) o.push($("<br>"));
                var ref_id = parseInt(m[2] ? m[2] : m[3], 10);
                if ($.inArray(ref_id, ref_ids) === -1) ref_ids.push(ref_id);
                o.push(quote_link(ref_id));
            }],
            [/https?:\/\/\S+/, function(m, o) {
                o.push($("<a target='_blank'/>").attr("href", m[0]).text(m[0]));
            }],
            [/(^|\r?\n)(>+)([^\r\n]*)/, function(m, o) {
                if (m[1]) o.push($("<br>"));
                var line = markup(m[3], rules);
                o.push($("<output class='greentext'/>").text(m[2]).append(line));
            }],
            [/\r?\n/, function(m, o) {
                o.push($("<br>"));
            }],
            [/\[code\]([\s\S]*?)\[\/code\]/, function(m, o) {
                o.push($("<pre class='code'/>").text(m[1]));
            }],
            [/\[spoiler\]([\s\S]*?)\[\/spoiler\]/, function(m, o) {
                o.push($("<span class='spoiler'/>").text(m[1]));
            }]
        ];
        var body = markup(data.body, rules);
        post.find(".chat_body").empty().append(body);

        // Create new backlinks
        $(ref_ids).each(function () {
            var link = quote_link(id);
            link.addClass("back_link");
            var their_refs = $("#chat_" + this + " .chat_refs");
            if (their_refs.length === 0) {
                if (future_ids[this] === undefined) future_ids[this] = $("<output />");
                future_ids[this].append(" ", link);
            } else {
                their_refs.append(" ", link);
            }
        });
    }
    if (new_post) {
        var convo_index = $.inArray(data.convo, convos);
        if (convo_index < 0) {
            convos.push(data.convo);
        } else {
            convos.splice(convo_index,1);
            convos.push(data.convo);
        }
        if (!first_load) draw_convos();
        notifications(data.convo);
        apply_filter(post);
        if (first_load) {
            if (window.location.hash === '#chat_' + id) {
                $("#autoscroll").prop('checked', false);
                var chat_container = post.parent();
                loaded_callbacks.push(function() {
                    chat_container.scrollTop(
                        post.offset().top - chat_container.offset().top + chat_container.scrollTop()
                    );
                });
            }
        } else {
            post.css('opacity', '0');
        }
        insert_post(post);
        if (!first_load) {
            post.animate({
                opacity: 1
            }, 300, 'swing', function () {
            });
        }
    }
    $(".spoiler").toggleClass("spoiled", !$('#spoilers').prop("checked"));

}

function draw_chat(data) {
    "use strict";
    var i;
    for (i = data.length - 1; i >= 0; i--) {
        update_chat(data[i], true);
    }
    draw_convos();
    if (!data[0])
    	return;
    var max_chat = data[0].count;
    var too_long = 1000;
    var counter = 0;
    var wait_for_last = setInterval(function () {
        if ($('#chat_' + max_chat).length) {
            clearInterval(wait_for_last);
            $.each(loaded_callbacks, function() {
                this();
            });
            scroll();
        } else {
            if (counter++ > too_long) {
                clearInterval(wait_for_last);
            }
        }
    }, 100);
}
