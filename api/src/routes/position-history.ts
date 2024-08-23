import { prisma } from "../db.js";
import express from "../express.js";

express.get("/api/v1/nodes/:nodeId/position-history", async (req, res) => {
	try {
		const nodeId = Number.parseInt(req.params.nodeId);
		const timeFrom = req.query.time_from
			? Number.parseInt(req.query.time_from)
			: new Date().getTime() - 3600 * 1000;
		const timeTo = req.query.time_to ? Number.parseInt(req.query.time_to) : new Date().getTime();

		const node = await prisma.node.findFirst({
			where: {
				node_id: nodeId,
			},
		});

		// make sure node exists
		if (!node) {
			res.status(404).json({
				message: "Not Found",
			});
			return;
		}

		const positions = await prisma.position.findMany({
			where: {
				node_id: nodeId,
				created_at: {
					gte: new Date(timeFrom),
					lte: new Date(timeTo),
				},
			},
		});

		const mapReports = await prisma.mapReport.findMany({
			where: {
				node_id: nodeId,
				created_at: {
					gte: new Date(timeFrom),
					lte: new Date(timeTo),
				},
			},
		});

		const positionHistory = [];

		positions.forEach((position) => {
			positionHistory.push({
				node_id: position.node_id,
				latitude: position.latitude,
				longitude: position.longitude,
				altitude: position.altitude,
				accuracy: position.accuracy,
				time: position.created_at,
			});
		});

		mapReports.forEach((mapReport) => {
			positionHistory.push({
				node_id: mapReport.node_id,
				latitude: mapReport.latitude,
				longitude: mapReport.longitude,
				altitude: mapReport.altitude,
				accuracy: mapReport.accuracy,
				time: mapReport.created_at,
			});
		});

		positionHistory.sort((a, b) => a.time - b.time);

		res.json({
			position_history: positionHistory,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: "Something went wrong, try again later.",
		});
	}
});
