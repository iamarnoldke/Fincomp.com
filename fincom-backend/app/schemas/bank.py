from pydantic import BaseModel, ConfigDict


class BankOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    short_code: str
    logo_url: str | None = None
