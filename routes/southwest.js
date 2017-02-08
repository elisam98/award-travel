var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var querystring = require('querystring');

router.get('/', function(req, res, next) {
	request.post('https://www.southwest.com/flight/select-flight.html',
		{
			form: {
				selectedOutboundTrip: '',
				selectedInboundTrip: '',
				promoCertSelected: false,
				transitionalAwardSelected: false,
				showAwardToggle: false,
				awardCertificateProductId: '',
				awardCertificateToggleSelected: false,
				oneWayCertificateOrAward: false,
				originAirport: req.query.origin.toUpperCase(),
				destinationAirport: req.query.destination.toUpperCase(),
				returnAirport: '',
				returnAirport_displayed: '',
				outboundDateString: req.query.date,
				outboundTimeOfDay: 'ANYTIME',
				adultPassengerCount: 1,
				seniorPassengerCount: 0,
				promoCode: '',
				modifySearchSubmitButton: 'Search',
				bugFareType: 'POINTS',
				embeddedFareDesignatorPromoCode: '',
				swaBizDiscountSearch: false,
				fareType: 'POINTS'
			}
		}, (err, httpResponse, body) => {
			var $ = cheerio.load(body, {
				normalizeWhitespace: true,
				xmlMode: true
			});
			var jsonify = [];

			$('table#faresOutbound').children('tbody').children('tr').each((i, el) => {
				var stops = parseInt($(el).children('.routing_column').find('a').text());

				var flightInfo = querystring.parse($(el).children('.routing_column').find('a').attr('href').slice(23));
				var flightDetails = querystring.parse($(el).children('.flight_column').find('a').eq(1).attr('href').slice(34));

				var flights = [];

				var prices = {
					business: $(el).children('.price_column').eq(0).find('.product_price').text(),
					anytime: $(el).children('.price_column').eq(1).find('.product_price').text(),
					saver: $(el).children('.price_column').eq(2).find('.product_price').text()

				}

				flights.push({
					flightNumber: parseInt(flightInfo.firstFlightNumber.slice(1)),
					carrier: flightInfo.firstOperCarrier,
					departs: flightInfo.firstFlightTime,
					arrives: flightInfo.firstFlightArrivalTime,
					originAirport: flightInfo.firstFlightOrigin.slice(-4, -1),
					destinationAirport: flightInfo.firstFlightDestination.slice(-4, -1),
					equipment: flightDetails.secondFlightEquipmentCode
				});

				if(stops == 1) {
					flights.push({
						flightNumber: parseInt(flightInfo.secondFlightNumber.slice(1)),
						carrier: flightInfo.secondOperCarrier,
						departs: flightInfo.secondFlightTime,
						arrives: flightInfo.secondFlightArrivalTime,
						originAirport: flightInfo.firstFlightDestination.slice(-4, -1),
						destinationAirport: flightInfo.secondFlightDestination.slice(-4, -1),
						equipment: flightDetails.secondFlightEquipmentCode
					});
				}
				var object = {
					departs: $(el).children('.depart_column').find('.bugText').text().trim(),
					arrives: $(el).children('.arrive_column').find('.bugText').text().trim(),
					summary: flightInfo.flightSummary,
					stops: parseInt(stops),
					flights: flights,
					prices: prices
				}

				jsonify.push(object);
//				console.log('Index: ' + i)
			});
			res.json(jsonify);
		}
	);
});

module.exports = router;
