<html>
	<head>
		<meta http-equiv="refresh" content="0; url=http://acyd.io/fun/chan"/>
	</head>
	<body>
		<?php
			$file = fopen("id.txt", "r");
			$nextPostID = intval(fgets($file)) + 1;
			fclose($file);
			
			echo "<center><h1>Thread Created:" . $nextPostID . "</center></h1>";
			$fileName = "threads/" . $nextPostID . ".txt";
			$text = "";
			if ($_GET["text"])
				$text = $_GET["text"];
			
			$file = fopen($fileName, "w");
			fwrite($file, $text);
			fclose($file);
			chmod($fileName, 0777);
			
			$file = fopen("id.txt", "w");
			fwrite($file, $nextPostID);
			fclose($file);
		?>
	</body>
</html>