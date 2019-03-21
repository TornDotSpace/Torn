<html>
	<head>
		<title>
			NameChan
		</title>
	</head>
	<body>
		NameChan
		<br>
		Threads:
		<?php
			$dir = "threads/";
			if ($dh = opendir($dir)) {
				while (($file = readdir($dh)) !== false)
					if ($file != "." && $file != "..") {
						$file = substr($file, 0, strrpos($file, "."));
						echo "<br><a href='viewthr.php?thread=" . $file . "'>" . $file . "</a>";
					}
			closedir($dh);
			}
		?>
		<br>
		<textarea cols="64" rows="8" id="newThread"></textarea>
		<br>
		<button onclick="location.href = 'newthr.php?text=' + document.getElementById('newThread').value">Make a Thread</button>
	</body>
</html>