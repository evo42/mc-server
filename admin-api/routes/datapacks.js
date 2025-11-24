const express = require('express');
const router = express.Router();
const datapacksController = require('../controllers/datapacksController');

router.get('/:server', datapacksController.getDatapacks);
router.post('/install/:server', datapacksController.installDatapack);
router.post('/uninstall/:server', datapacksController.uninstallDatapack);
router.get('/search', datapacksController.searchDatapacks);

module.exports = router;
