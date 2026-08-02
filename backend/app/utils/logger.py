"""
Structured logging with JSON output for production, readable output for dev.
"""

import logging
import sys

from app.config import get_settings


def setup_logger(name: str = "banking_advisor") -> logging.Logger:
    """Create a configured logger instance."""
    settings = get_settings()
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    level = logging.DEBUG if settings.APP_ENV == "development" else logging.INFO
    logger.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    if settings.APP_ENV == "development":
        formatter = logging.Formatter(
            "%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
            datefmt="%H:%M:%S",
        )
    else:
        formatter = logging.Formatter(
            '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}'
        )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


logger = setup_logger()
