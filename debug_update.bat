@echo off
echo Starting update_esi_stats.cjs > update_debug_log.txt
node update_esi_stats.cjs >> update_debug_log.txt 2>&1
echo Starting build_esi_database.cjs >> update_debug_log.txt
node build_esi_database.cjs >> update_debug_log.txt 2>&1
echo Done >> update_debug_log.txt
