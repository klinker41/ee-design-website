jQuery.fn.updateWithText = function(text, speed) {
	var dummy = $('<div/>').html(text);

	if ($(this).html() != dummy.html())
	{
		$(this).fadeOut(speed/2, function() {
			$(this).html(text);
			$(this).fadeIn(speed/2, function() {
				// done
			});
		});
	}
}

function sendTemperatureBoundsError($, temp) {
	/*
		Sends a push notification to luke's phone, which will send a text from there.
		messages are send as a url encoded json parameter.
		ex (with the 3 supported fields):
		{
			"message_type":"send_sms", 					// never changes
			"text_to_send":"test", 						// message can be anything
			"number_to_send_to":"5159911493"			// only digits, no other characters
		}

		For URL encoding:
		{ = %7B
		} = %7D
		space = %20
		" = %22
		comma = %2C
		colon = %3A
	*/

	var replacements = [
		["{", "%7B"],
		["}", "%7D"],
		[" ", "%20"],
		["\"", "%22"],
		[",", "%2C"],
		[":", "%3A"]
	]

	var message = "Temperature out of bounds: " + temp + ' °' + temp_type;
	var to = $('#phone_number').val();
	var json = '{ "message_type":"send_sms", "text_to_send":"' + message + '", "number_to_send_to":"' + to + '" }';

	for (var i = 0; i < replacements.length; i++) {
		json = replaceAll(replacements[i][0], replacements[i][1], json);
	}

	$.post("https://omega-jet-799.appspot.com/_ah/api/messaging/v1/sendSms/" + json, 
    		function(response) { });
}

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function roundVal(temp) {
	return Number(temp).toFixed(2);
}

function c2f(c) {
	return Number(c) * 1.8 + 32;
}

function generateChart() {
	return chart = c3.generate({
		    bindto: '#temperature_chart',
		    data: { columns: [ ], type: 'spline' },
		    tooltip: { show: false },
			axis: {
		      y: { 
		      	label: { text: 'Temperature (°C)', position: 'outer-middle' },
		      	min: 10, max: 50
		      },
		      x: {
		        label: { text: 'Time Ago (Seconds)', position: 'outer-middle' }, 
		        tick: { values: [300, 250, 200, 150, 100, 50, 0] },
		        min: 0, max: 300
		      }
		    }
		});
}

jQuery(document).ready(function($) {
	// generate the chart with a blank curve first. 
	// will update when the GET call is done.
	var chart = generateChart();

	// function to update the current temperature.
	// this reschedules itself every one second.
    (function updateTemp() {
		$.getJSON("http://default-environment-serpnbmp6z.elasticbeanstalk.com/temperature/latest?type=" + temp_type, {}, function(json, status) {
			// set the data according to the json returned
        	current_temperature = json.temp;

    		if (json.temp == null) {
        		$('#current_temperature').updateWithText("Data Unavailable.",300);
        	} else if (current_temperature > 400) {
        		$('#current_temperature').updateWithText("Sensor Unplugged.",300);
        	} else {
        		var min_temp = $('#min_temp').val();
        		var max_temp = $('#max_temp').val();
        		if (min_temp && max_temp && $('#phone_number').val() && (current_temperature > Number(max_temp) || current_temperature < Number(min_temp))) {
        			sendTemperatureBoundsError($, current_temperature);
        		}

        		$('#current_temperature').updateWithText(current_temperature + ' °' + temp_type,300);
    		}
		}).fail(function() {
			// Something went wrong, chances are the server is down
			$('#current_temperature').updateWithText("Error Reaching Endpoint.",300);
		});

		// reschedule this function
        setTimeout(function() {
            updateTemp();
        }, 1000);
    })();

	// function to update the past temperature graph
	// this reschedules itself every one second.
	(function updateTempList() {
		$.getJSON("http://default-environment-serpnbmp6z.elasticbeanstalk.com/temperature", {}, function(json, status) {
        	// the temperatures get loaded into the array in reverse
        	var tempList = ['Temperatures'];

			for (var i = json.temps.length - 1; i >= 0; i--) {
				var temp = json.temps[i];
				tempList.push(parseInt(temp));
			}

			// display the temps on the graph
			chart.load({ columns: [ tempList ] });
		});

		// reschedules itself after 1 second
        setTimeout(function() {
            updateTempList();
        }, 1000);
    })();

    // turn on the hardware display when we start up the website
    (function setConfig() {
		$.post("http://default-environment-serpnbmp6z.elasticbeanstalk.com/config/update?pressed=0", 
    		function(response) { });
    })();

    // execute when the checkbox is changed
    $('#celcius_checkbox').change(function() {
    	if (this.checked) {
    		temp_type = 'C';
    	} else {
    		temp_type = 'F';
    	}
    });

    // toggle the button state on the physical device
    $('#toggle_switch').change(function() {
    	var pressed = '0';
    	if (this.checked) { pressed = '1'; }
    	$.post("http://default-environment-serpnbmp6z.elasticbeanstalk.com/config/update?pressed=" + pressed, 
    		function(response) { });
    });

    $('#temperature_chart').resizable();
});
