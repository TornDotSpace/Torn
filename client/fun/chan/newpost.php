<html>
	<body>
		<?php
			$file = fopen("id.txt", "r");
			$nextPostID = intval(fgets($file)) + 1;
			fclose($file);
			
			echo "<center><h1>Post Created:" . $nextPostID . "</center></h1>";
			$fileName = "";
			if ($_GET["thread"]) {
				$fileName = "threads/" . $_GET["thread"] . ".txt";
				echo "<meta http-equiv=\"refresh\" content=\"0; url=http://acyd.io/fun/chan/viewthr.php?thread=" . $_GET["thread"] . "\"/>";
			}
			$text = "";
			if ($_GET["text"])
				$text = $_GET["text"];
			
			file_put_contents($fileName, PHP_EOL . $text, FILE_APPEND);
			
			$file = fopen("id.txt", "w");
			fwrite($file, $nextPostID);
			fclose($file);
		?>
	</body>
</html>