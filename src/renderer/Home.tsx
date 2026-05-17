import { useEffect, useState } from 'react';
import {
    Box,
    Chip,
    Container,
    Paper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

interface DeviceRow {
    status: 'live' | 'lost';
    serialNumber?: string;
    ledDrive?: string;
    lastUpdate?: string;
}

export default function Home() {
    const [devices, setDevices] = useState<Map<string, DeviceRow>>(new Map());
    const [ledOn, setLedOn] = useState<Map<string, boolean>>(new Map());

    useEffect(() => {
        window.api.getDevices().then((paths) => {
            setDevices((prev) => {
                const next = new Map(prev);
                for (const p of paths) {
                    if (!next.has(p)) next.set(p, { status: 'live' });
                }
                return next;
            });
        });

        const unsubChanged = window.api.onDevicesChanged((paths) => {
            setDevices((prev) => {
                const next = new Map(prev);
                for (const p of [...next.keys()]) {
                    if (!paths.includes(p)) next.delete(p);
                }
                for (const p of paths) {
                    if (!next.has(p)) next.set(p, { status: 'live' });
                }
                return next;
            });
        });

        const unsubUpdated = window.api.onDeviceUpdated(({ path, serialNumber, ledDrive }) => {
            setDevices((prev) => {
                const next = new Map(prev);
                next.set(path, {
                    status: 'live',
                    serialNumber,
                    ledDrive,
                    lastUpdate: new Date().toLocaleTimeString(),
                });
                return next;
            });
        });

        const unsubLost = window.api.onDeviceLost(({ path }) => {
            setDevices((prev) => {
                const next = new Map(prev);
                const existing = next.get(path);
                if (existing) next.set(path, { ...existing, status: 'lost' });
                return next;
            });
        });

        return () => {
            unsubChanged();
            unsubUpdated();
            unsubLost();
        };
    }, []);

    const handleLedToggle = async (path: string, on: boolean) => {
        setLedOn((prev) => new Map(prev).set(path, on));
        const ok = on ? await window.api.ledOn(path) : await window.api.ledOff(path);
        if (!ok) {
            // Roll back if the device rejected the command.
            setLedOn((prev) => new Map(prev).set(path, !on));
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                Devices
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Live state from the polling loop, pushed over Electron IPC.
            </Typography>
            <Paper variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Path</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Serial #</TableCell>
                            <TableCell>LED Drive</TableCell>
                            <TableCell>Last Update</TableCell>
                            <TableCell align="right">LED</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {devices.size === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ color: 'text.secondary' }}>
                                    waiting for first device...
                                </TableCell>
                            </TableRow>
                        ) : (
                            [...devices.entries()].map(([path, d]) => {
                                const stale = d.status === 'lost';
                                return (
                                    <TableRow key={path} sx={{ opacity: stale ? 0.5 : 1 }}>
                                        <TableCell>{path}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={d.status}
                                                size="small"
                                                color={stale ? 'error' : 'success'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{d.serialNumber ?? '-'}</TableCell>
                                        <TableCell>{d.ledDrive ?? '-'}</TableCell>
                                        <TableCell>{d.lastUpdate ?? '-'}</TableCell>
                                        <TableCell align="right">
                                            <Switch
                                                size="small"
                                                checked={ledOn.get(path) ?? false}
                                                disabled={stale}
                                                onChange={(e) => handleLedToggle(path, e.target.checked)}
                                                inputProps={{ 'aria-label': `LED toggle for ${path}` }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Paper>
            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Dev mode auto-mocks two devices. mock-a flips unresponsive at 8s and recovers
                    at 18s to demonstrate the liveness path.
                </Typography>
            </Box>
        </Container>
    );
}
