jQuery.fn.updateWithText = function(text, speed) {
	var dummy = $('<div/>').html(text);

	if ($(this).html() != dummy.html())
	{
		$(this).fadeOut(speed/2, function() {
			$(this).html(text);
			$(this).fadeIn(speed/2, function() {
				//done
			});
		});
	}
}

function roundVal(temp) {
	return Math.round(Number(temp));
}

function c2f(c) {
	return Number(c) * 1.8 + 32;
}

jQuery(document).ready(function($) {
	var chart = null;

    (function updateTemp() {
		$.getJSON("http://173.17.168.19:8083/lab1/temperature/latest", {}, function(json, status) {
        	current_temperature = json.temp;
    		if (current_temperature == null) {
        		$('#current_temperature').updateWithText("Data Unavailable.",300);
    		} else {
        		$('#current_temperature').updateWithText(current_temperature + ' °' + temp_reading,300);
    		}
		}).fail(function() {
			$('#current_temperature').updateWithText("Error Reaching Endpoint.",300);
		});

        setTimeout(function() {
            updateTemp();
        }, 1000);
    })();

	chart = c3.generate({
		    bindto: '#temperature_chart',
		    data: {
		      columns: [
		        ['Temperature Reading', 300, 100, 250, 150, 300, 150, 500]
		      ],
		      type: 'spline'
		    },
		    zoom: {
    		  enabled: true
			},
			axis: {
		      y: {
		        label: {
		          text: 'Temperature (°' + temp_reading + ')',
		          position: 'outer-middle'
		        }
		      },
		      x: {
		        label: {
		          text: 'Time Ago (Seconds)',
		          position: 'outer-middle'
		        }
		      }
		    }
		});

	(function updateTempList() {
		$.getJSON("http://173.17.168.19:8083/lab1/temperature", {}, function(json, status) {
        	var tempList = {};
			for (var i in json.temps) {
				var temp = json.temps[i];
				tempList[i] = {
					'temp':temp
				};
			}

			chart.load({
			  columns: [
			    ['Temperature Reading', 450, 300, 400, null, 250, 150, 100, 275, 325, 500]
			  ]
			});

			// TODO
			// we will have to update the table here, however we make it.
			//
			// we can parse through the temp data with:
			// for (var i int tempList) {
			// 		var temp = tempList[i].temp
			// }


		}).fail(function() {

		});

        /*setTimeout(function() {
            updateTempList();
        }, 1000);*/
    })();
});
