const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./db/smart_building.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the smart_building database.');
});

// 获取所有方法
app.get('/methods', (req, res) => {
    const sql = 'SELECT * FROM methods';
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// 提交新方法
app.post('/methods', (req, res) => {
    const { method_name, privacy, delay, occupancy_level, accuracy, accuracy_group_detection, accuracy_high_activity, accuracy_low_activity, spatial_resolution, internal_data_reliant, external_data_reliant, energy_source, energy_consumption, maintenance, research_category, sensor_cost, installation_cost, computing_cost, scalability, robustness } = req.body;
    
    const sql = `
        INSERT INTO methods (method_name, privacy, delay, occupancy_level, accuracy, accuracy_group_detection, accuracy_high_activity, accuracy_low_activity, spatial_resolution, internal_data_reliant, external_data_reliant, energy_source, energy_consumption, maintenance, research_category, sensor_cost, installation_cost, computing_cost, scalability, robustness) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [method_name, privacy, delay, occupancy_level, accuracy, accuracy_group_detection, accuracy_high_activity, accuracy_low_activity, spatial_resolution, internal_data_reliant, external_data_reliant, energy_source, energy_consumption, maintenance, research_category, sensor_cost, installation_cost, computing_cost, scalability, robustness];
    
    db.run(sql, params, function(err) {
        if (err) {
            return console.error(err.message);
        }
        res.json({ id: this.lastID });
    });
});

// 计算并返回最佳方法
app.get('/best-methods', (req, res) => {
    const sql = 'SELECT * FROM methods';
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }

        const weights = {};
        const criteria = [
            'privacy', 'delay', 'occupancy_level', 'accuracy', 'accuracy_group_detection',
            'accuracy_high_activity', 'accuracy_low_activity', 'spatial_resolution', 'internal_data_reliant',
            'external_data_reliant', 'energy_source', 'energy_consumption', 'maintenance',
            'research_category', 'sensor_cost', 'installation_cost', 'computing_cost', 'scalability',
            'robustness'
        ];

        // 计算每个标准的权重
        criteria.forEach(criterion => {
            weights[criterion] = rows.reduce((sum, row) => sum + row[criterion], 0);
        });

        // 计算每个方法的加权和
        const results = rows.map(method => {
            let weightedSum = 0;
            criteria.forEach(criterion => {
                weightedSum += weights[criterion] * method[criterion];
            });
            return {
                method: method.method_name,
                weightedSum: weightedSum,
                details: method
            };
        });

        // 对方法按加权和排序并返回前两个
        results.sort((a, b) => b.weightedSum - a.weightedSum);
        res.json(results.slice(0, 2));
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
