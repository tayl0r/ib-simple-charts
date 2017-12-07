<?php

// $apiKey needs to be a string
$apiKey = "000000000000000";
$demo = true;

$reportId = $_GET["q"];
$serviceName = $_GET["service"];

if ($demo == false) {
	$response = http_get(
		"https://gdcdyn.interactivebrokers.com/Universal/servlet/" . $serviceName . "?v=2&t=" . $apiKey . "&q=" . $reportId,
		array(
			"timeout" => 30,
			"useragent" => "Java"
		),
		$info
	);

	if ($info['response_code'] >= 200 && $info['response_code'] < 300 && $response) {
		$xml = http_parse_message($response)->body;
		print $xml;

		// also write to file
		file_put_contents("xml/" . $serviceName . "_" . $reportId . ".xml", $xml);
	}
} else {
	$xml = file_get_contents("xml/" . $serviceName . "_" . $reportId . ".xml");
	print $xml;
}

?>
