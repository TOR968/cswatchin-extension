import Millennium  # pyright: ignore[reportMissingImports]
import PluginUtils  # pyright: ignore[reportMissingImports]
import requests
import json
import cloudscraper
from logger import logger
from settings import PluginSettings  # Import settings

session = cloudscraper.create_scraper()

plugin_settings = PluginSettings()

def get_cswatch_data(steam_id: str) -> dict:
    """
    Server method to fetch CSWatch data for a given Steam ID
    This runs on the backend and avoids CORS issues
    """
    try:
        logger.info(f"CSWatch Extension: Fetching data for Steam ID {steam_id}")

        url = f"https://cswatch.in/api/players/{steam_id}"
        response = session.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()
            logger.info(
                f"CSWatch Extension: Successfully fetched data for Steam ID {steam_id}"
            )
            return {"success": True, "data": data}
        else:
            logger.error(
                f"CSWatch Extension: API request failed with status {response.status_code}"
            )
            return {
                "success": False,
                "error": f"API request failed with status {response.status_code}",
            }
    except requests.exceptions.RequestException as e:
        logger.error(f"CSWatch Extension: Request error: {str(e)}")
        return {"success": False, "error": f"Request error: {str(e)}"}
    except Exception as e:
        logger.error(f"CSWatch Extension: Unexpected error: {str(e)}")
        return {"success": False, "error": f"Unexpected error: {str(e)}"}


class Plugin:
    def _load(self) -> None:
        try:
            logger.info("CSWatch Extension: Starting plugin initialization...")
            Millennium.ready()
            logger.info("CSWatch Extension: Plugin loaded successfully")
        except Exception as e:
            logger.error(f"CSWatch Extension: Failed to load plugin: {str(e)}")
            raise

    def _front_end_loaded(self) -> None:
        try:
            logger.info("CSWatch Extension: Frontend loaded successfully")
            # Add any frontend-specific initialization logic here if needed
        except Exception as e:
            logger.error(f"CSWatch Extension: Error during frontend load: {str(e)}")

    def _unload(self) -> None:
        try:
            logger.info("CSWatch Extension: Plugin unloading...")
            # Close the session
            session.close()
            logger.info("CSWatch Extension: Plugin unloaded successfully")
        except Exception as e:
            logger.error(f"CSWatch Extension: Error during plugin unload: {str(e)}")

get_cswatch_data = get_cswatch_data
