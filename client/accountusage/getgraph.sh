sudo rm accusagedata.txt;
sudo rm data.json;
sudo grep -h "logged in as" ../../logs/* | awk '!/GUEST/' | cut -d'!' -f1 | cut -d' ' -f6,2 | sort | uniq | tee accusagedata.txt;
sudo echo -n "data = '{\"data\":\"" >> data.json;
sudo sed -z 's/\n/ /g' accusagedata.txt >> data.json;
sudo echo "\"}'" >> data.json;
sudo rm accusagedata.txt;
