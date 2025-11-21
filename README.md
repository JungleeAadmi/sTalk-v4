will be updated soon. 


**To Install:**
```
bash <(curl -s https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/install.sh)
```
**To Update later:**
```
bash <(curl -s https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/update.sh)
```
**To Uninstall:**
```
bash <(curl -s https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/uninstall.sh)
```
**To remove permanently**

```
bash <(curl -s [https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/remove-complete.sh](https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/remove-complete.sh))
```
### Important Note on User Data
Currently, your app uses **`localStorage`** (Mock DB) inside `index.html`. This means the user data (chats, profiles) lives **in the user's browser**, not on the server.
* **Updating the server (`update.sh`) is perfectly safe.** It only changes the HTML/JS files served. It does not touch the user's browser storage.
* **Uninstalling the server** also does not delete data from the user's phone, as the data is cached locally on their device.