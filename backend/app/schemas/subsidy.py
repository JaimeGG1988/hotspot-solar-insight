from pydantic import BaseModel, Field, validator
from typing import Optional, Literal

class SubsidyBase(BaseModel):
    name: str = Field(..., description="Nombre de la subvención.")
    region_code: str = Field(..., description="Código de la región a la que aplica (ej. ES, ES-MD).")
    type: Literal['percentage_cost', 'fixed_amount', 'amount_per_kwp'] = Field(..., description="Tipo de cálculo de la subvención.")
    value: float = Field(..., description="Valor numérico de la subvención (porcentaje como 0.xx, cantidad fija, o €/kWp).")
    max_amount_eur: Optional[float] = Field(None, description="Límite máximo de la ayuda en euros.")
    min_kwp_required: Optional[float] = Field(0.0, description="Tamaño mínimo de la instalación en kWp para ser elegible.")
    max_kwp_eligible: Optional[float] = Field(None, description="Tamaño máximo de la instalación en kWp que es elegible.")
    conditions_text: Optional[str] = Field(None, description="Descripción textual de otras condiciones.")
    applicable_to_entity_type: Optional[Literal['residential', 'business', 'community', 'any']] = Field('residential', description="Tipo de entidad a la que aplica la subvención.")
    source_url: Optional[str] = Field(None, description="URL a la fuente oficial de la subvención.")
    start_date: Optional[str] = Field(None, description="Fecha de inicio de validez (YYYY-MM-DD).")
    end_date: Optional[str] = Field(None, description="Fecha de fin de validez (YYYY-MM-DD).")
    is_active: bool = Field(True, description="Indica si la subvención está activa.")

    @validator('start_date', 'end_date', pre=True, allow_reuse=True)
    def parse_date_to_string(cls, value):
        # SQLite no tiene un tipo DATE nativo, se almacenan como TEXT.
        # Este validador es más para asegurar que si viene un objeto date, se maneje,
        # pero principalmente esperamos strings.
        if value is None:
            return None
        # if isinstance(value, date):
        #     return value.isoformat()
        if isinstance(value, str):
            # Aquí se podría añadir validación del formato YYYY-MM-DD
            return value
        raise ValueError("Formato de fecha inválido, se espera YYYY-MM-DD o None.")


class SubsidyCreate(SubsidyBase):
    pass

class Subsidy(SubsidyBase):
    id: int = Field(..., description="Identificador único de la subvención.")

    class Config:
        orm_mode = True # Permite cargar datos desde objetos ORM (o diccionarios con forma de ORM)

# Ejemplo para la salida del servicio que podría incluir el monto calculado de la subvención
class AppliedSubsidy(Subsidy):
    calculated_amount_eur: float = Field(..., description="Monto de la subvención calculado para el escenario específico.")
