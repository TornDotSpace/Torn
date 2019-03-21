<html>
	<head>
	</head>
	<body>
		<?php
			$current = "";
			if ($_GET["thread"])
				$current = $_GET["thread"];
			$fileName = "threads/" . $current . ".txt";
			$file = fopen($fileName, "r");
			if ($file)
				while (!feof($file))
					echo fgets($file) . "<br>";
			fclose($file);
		?>
		<br>
		<textarea cols="64" rows="8" id="newPost"></textarea>
		<br>
		<button onclick="location.href = 'newpost.php?thread=<?php
			if ($_GET["thread"])
				echo $_GET["thread"];
		?>&text=' + document.getElementById('newPost').value.replace(new RegExp('\n', 'g'), '`');">Post</button>
	</body>
<html>