import type { Millennium, CSWatchPlayer, CSWatchAnalysisBreakdown, CSWatchAnalysis, CSWatchResponse, CSWatchAPIResponse } from './types';

declare const Millennium: Millennium;

export default async function WebkitMain() {
	try {
		if (typeof Millennium === 'undefined') {
			console.error('CSWatch: Millennium API not available in webkit context');
			return;
		}

		const styles = `
		.cswatch-container {
			display: flex;
			flex-direction: column;
			background-color: #1e1e1e;
			border-radius: 5px;
			padding: 15px;
			margin-bottom: 15px;
			box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
		}

		.cswatch-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 15px;
			padding-bottom: 10px;
			border-bottom: 1px solid #333;
		}

		.cswatch-logo {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.cswatch-logo-text {
			font-size: 20px;
			font-weight: bold;
			color: #00bfff;
		}

		.cswatch-loader {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 20px;
		}

		.cswatch-loader-spinner {
			border: 3px solid #333;
			border-top: 3px solid #00bfff;
			border-radius: 50%;
			width: 30px;
			height: 30px;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}

		.cswatch-stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 15px;
			margin-bottom: 15px;
		}

		.cswatch-stat-card {
			background-color: #2d2d2d;
			border-radius: 5px;
			padding: 10px;
			text-align: center;
		}

		.cswatch-stat-label {
			font-size: 12px;
			color: #aaa;
			margin-bottom: 5px;
		}

		.cswatch-stat-value {
			font-size: 18px;
			font-weight: bold;
			color: #fff;
		}

		.cswatch-risk-low {
			color: #00ff00;
		}
		.cswatch-risk-medium {
			color: #ffff00;
		}
		.cswatch-risk-high {
			color: #ff8c00;
		}
		.cswatch-risk-very-high {
			color: #ff0000;
		}

		.cswatch-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 12px;
			color: #777;
		}

		.cswatch-link {
			color: #00bfff;
			text-decoration: none;
			cursor: pointer;
		}

		.cswatch-link:hover {
			text-decoration: underline;
		}

		.cswatch-error {
			color: #ff4444;
			text-align: center;
			padding: 15px;
		}
		`;

		const styleSheet = document.createElement('style');
		styleSheet.innerText = styles;
		document.head.appendChild(styleSheet);

		const rightCol = await Millennium.findElement(document, '.profile_leftcol');

		if (rightCol.length > 0) {
			const parser = new DOMParser();
			const profileUrl = `${window.location.href}/?xml=1`;

			const profileResponse = await fetch(profileUrl);
			if (!profileResponse.ok) {
				console.error(`CSWatch: Failed to fetch profile data: ${profileResponse.status} ${profileResponse.statusText}`);
				return;
			}

			const profileXmlText = await profileResponse.text();
			const profileXmlDoc = parser.parseFromString(profileXmlText, 'application/xml');

			const steamID64 = profileXmlDoc.querySelector('steamID64')?.textContent || '0';

			if (!steamID64 || steamID64 === '0') {
				console.error('CSWatch: Could not parse steamID64 from URL.');
				return;
			}

			const statsContainer = document.createElement('div');
			statsContainer.className = 'cswatch-container';

			const header = document.createElement('div');
			header.className = 'cswatch-header';

			const logo = document.createElement('div');
			logo.className = 'cswatch-logo';

			const logoText = document.createElement('div');
			logoText.className = 'cswatch-logo-text';
			logoText.textContent = 'CSWATCH.IN';

			logo.appendChild(logoText);
			header.appendChild(logo);
			statsContainer.appendChild(header);

			const loader = document.createElement('div');
			loader.className = 'cswatch-loader';
			loader.innerHTML = '<div class="cswatch-loader-spinner"></div>';
			statsContainer.appendChild(loader);

			rightCol[0].insertBefore(statsContainer, rightCol[0].firstChild);

			try {
				console.log(`CSWatch: Calling backend method for Steam ID ${steamID64}`);

				let cswatchResponseRaw;
				const methodNames = ['get_cswatch_data', 'Plugin.get_cswatch_data', 'cswatch_extension.get_cswatch_data'];

				for (const methodName of methodNames) {
					try {
						cswatchResponseRaw = await Promise.race([
							Millennium.callServerMethod(methodName, { steam_id: steamID64 }),
							new Promise((_, reject) => setTimeout(() => reject(new Error(`Backend call timeout for ${methodName}`)), 10000)),
						]);
						console.log(`CSWatch: Successfully called backend method ${methodName}`, cswatchResponseRaw);
						break;
					} catch (error) {
						console.log(`CSWatch: Failed to call backend method ${methodName}`, error);
						if (methodName === methodNames[methodNames.length - 1]) {
							throw error;
						}
					}
				}

				statsContainer.removeChild(loader);

				console.log('CSWatch: Raw response type:', typeof cswatchResponseRaw);
				console.log('CSWatch: Raw response keys:', cswatchResponseRaw ? Object.keys(cswatchResponseRaw) : 'null');

				if (!cswatchResponseRaw) {
					throw new Error('No response received from backend');
				}

				let parsedResponse: any;
				if (typeof cswatchResponseRaw === 'string') {
					try {
						parsedResponse = JSON.parse(cswatchResponseRaw);
						console.log('CSWatch: Successfully parsed JSON response');
					} catch (parseError) {
						console.error('CSWatch: Failed to parse JSON response', parseError);
						throw new Error('Failed to parse response from backend');
					}
				} else {
					parsedResponse = cswatchResponseRaw;
				}

				let cswatchResponse: CSWatchAPIResponse;

				if (typeof parsedResponse === 'object' && parsedResponse !== null) {

					if (parsedResponse.hasOwnProperty('success')) {
						cswatchResponse = parsedResponse as CSWatchAPIResponse;
					}

					else if (parsedResponse.hasOwnProperty('player') && parsedResponse.hasOwnProperty('csWatchAnalysis')) {
						cswatchResponse = {
							success: true,
							data: parsedResponse as unknown as CSWatchResponse,
						};
					}

					else {
						cswatchResponse = {
							success: true,
							data: parsedResponse as unknown as CSWatchResponse,
						};
					}
				} else {

					throw new Error('Invalid response format from backend - response is not an object');
				}

				if (!cswatchResponse.success) {
					const errorMessage = cswatchResponse.hasOwnProperty('error') ? cswatchResponse.error : 'Unknown error from backend';
					throw new Error(errorMessage || 'Unknown error from backend');
				}

				if (!cswatchResponse.data) {
					throw new Error('No data received from CSWatch API');
				}

				const cswatchData: CSWatchResponse = cswatchResponse.data;

				if (!cswatchData.player || !cswatchData.csWatchAnalysis) {
					throw new Error('Invalid data structure received from CSWatch API');
				}

				if (cswatchData.csWatchAnalysis.message === 'Insufficient data - Leetify data required') {

					if (statsContainer.contains(loader)) {
						statsContainer.removeChild(loader);
					}

					const errorDiv = document.createElement('div');
					errorDiv.className = 'cswatch-error';
					errorDiv.textContent = 'Insufficient data - Leetify data required';
					errorDiv.style.textAlign = 'center';
					statsContainer.appendChild(errorDiv);
					return;
				}

				const statsGrid = document.createElement('div');
				statsGrid.className = 'cswatch-stats-grid';

				const formatValue = (value: number | null, decimals: number = 2, suffix: string = ''): string => {
					if (value === null || value === undefined) {
						return 'N/A';
					}
					return `${value.toFixed(decimals)}${suffix}`;
				};

				const stats = [
					{ label: 'K/D Ratio', value: formatValue(cswatchData.player.csWatchStats.kdRatio, 2) },
					{ label: 'Time to Damage', value: formatValue(cswatchData.player.csWatchStats.reactionTimeMs, 1, 'ms') },
					{ label: 'Preaim', value: formatValue(cswatchData.player.csWatchStats.preaim, 1, '°') },
					{ label: 'Aim Rating', value: formatValue(cswatchData.player.csWatchStats.aimRating, 1) },
					{ label: 'Win Rate', value: cswatchData.player.csWatchStats.winrate !== null ? `${(cswatchData.player.csWatchStats.winrate * 100).toFixed(1)}%` : 'N/A' },
					{ label: 'Matches', value: cswatchData.player.csWatchStats.totalMatches !== null ? cswatchData.player.csWatchStats.totalMatches.toString() : 'N/A' },
				];

				stats.forEach((stat) => {
					const statCard = document.createElement('div');
					statCard.className = 'cswatch-stat-card';

					const statLabel = document.createElement('div');
					statLabel.className = 'cswatch-stat-label';
					statLabel.textContent = stat.label;

					const statValue = document.createElement('div');
					statValue.className = 'cswatch-stat-value';
					statValue.textContent = stat.value;

					statCard.appendChild(statLabel);
					statCard.appendChild(statValue);
					statsGrid.appendChild(statCard);
				});

				statsContainer.appendChild(statsGrid);

				const riskMessage = document.createElement('div');

				let riskClass = 'cswatch-risk-low';
				const score = cswatchData.totalSuspicionScore;
				if (score >= 75) {
					riskClass = 'cswatch-risk-very-high';
				} else if (score >= 50) {
					riskClass = 'cswatch-risk-high';
				} else if (score >= 25) {
					riskClass = 'cswatch-risk-medium';
				}

				riskMessage.className = `cswatch-stat-value ${riskClass}`;
				riskMessage.textContent = cswatchData.csWatchAnalysis.message || 'Unknown risk';
				riskMessage.style.textAlign = 'center';
				riskMessage.style.marginBottom = '15px';
				statsContainer.appendChild(riskMessage);

				const footer = document.createElement('div');
				footer.className = 'cswatch-footer';

				const lastUpdated = document.createElement('div');
				lastUpdated.textContent = `Updated: ${new Date(cswatchData.lastUpdated).toLocaleDateString()}`;

				const link = document.createElement('a');
				link.className = 'cswatch-link';
				link.textContent = 'View Full Profile';
				link.onclick = () => {
					window.open(`https://cswatch.in/player/${steamID64}`, '_blank');
				};

				footer.appendChild(lastUpdated);
				footer.appendChild(link);
				statsContainer.appendChild(footer);
			} catch (error) {

				if (statsContainer.contains(loader)) {
					statsContainer.removeChild(loader);
				}

				const errorDiv = document.createElement('div');
				errorDiv.className = 'cswatch-error';
				errorDiv.textContent = `Failed to load CSWatch data: ${error.message}`;
				statsContainer.appendChild(errorDiv);

				console.error('CSWatch: Error fetching data:', error);
			}
		} else {
			console.error('CSWatch: Parent container ".profile_leftcol" not found');
		}
	} catch (error) {
		console.error('CSWatch: Error in WebkitMain:', error);
		console.error('CSWatch: Stack trace:', error.stack);
	}
}
